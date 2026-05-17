const mongoose = require('mongoose');
const Product  = require('../models/Product');
const { Review } = require('../models/index');
const User     = require('../models/User');
const { cloudinary } = require('../middleware/upload');

exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, search, category, subcategory, brand,
      minPrice, maxPrice, sort = '-createdAt', seller, isFeatured, isTrending,
    } = req.query;

    // If a specific seller is filtering their own products (seller panel), show all their products.
    // For public/buyer view, only show active + approved products.
    const isSeller = req.user && (req.user.role === 'seller' || req.user.role === 'admin') && seller && seller === String(req.user._id);
    const query = isSeller
      ? { seller }
      : { isActive: true, approvalStatus: 'approved' };

    if (search)            query.$text = { $search: search };
    if (category)          query.category = category;
    if (subcategory)       query.subcategory = subcategory;
    if (brand)             query.brand = brand;
    if (!isSeller && seller) query.seller = seller;
    if (isFeatured === 'true') query.isFeatured = true;
    if (isTrending === 'true') query.isTrending = true;
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      // Use $and to avoid overwriting any existing $or clause on the query
      const priceOr = [
        { discountPrice: { ...priceFilter, $gt: 0 } },
        { $and: [{ discountPrice: { $lte: 0 } }, { price: priceFilter }] },
      ];
      query.$and = [...(query.$and || []), { $or: priceOr }];
    }

    const total    = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('seller', 'name avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const isValidId = mongoose.Types.ObjectId.isValid(req.params.id);
    const baseQuery = isValidId ? { _id: req.params.id } : { slug: req.params.id };

    // Sellers/admins can preview their own pending products; buyers only see approved+active
    const isOwnerOrAdmin =
      req.user && (req.user.role === 'admin' ||
        (req.user.role === 'seller'));
    const product = await Product.findOne({
      ...baseQuery,
      ...(isOwnerOrAdmin ? {} : { isActive: true, approvalStatus: 'approved' }),
    }).populate('seller', 'name avatar email');

    // Sellers can only see their own products if not admin
    let finalProduct = product;
    if (finalProduct && req.user?.role === 'seller' && req.user.role !== 'admin') {
      const isPublic = finalProduct.isActive && finalProduct.approvalStatus === 'approved';
      const isOwn    = finalProduct.seller?._id?.toString() === req.user._id.toString();
      if (!isPublic && !isOwn) finalProduct = null;
    }

    if (!finalProduct) return res.status(404).json({ success: false, message: 'Product not found' });

    await Product.findByIdAndUpdate(finalProduct._id, { $inc: { viewCount: 1 } });

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { viewedProducts: { $each: [finalProduct._id], $slice: -50 } },
      });
    }

    const reviews = await Review.find({ product: finalProduct._id })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .limit(20);

    res.json({ success: true, product: finalProduct, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    // Auto-approve new listings so they go live for buyers immediately.
    // Admins can reject or unfeature from the admin panel if needed.
    const product = await Product.create({
      ...req.body,
      seller: req.user._id,
      approvalStatus: 'approved',
      isActive: true,
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter  = isAdmin ? { _id: req.params.id } : { _id: req.params.id, seller: req.user._id };
    const product = await Product.findOne(filter);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, seller: req.user._id };
    const product = await Product.findOneAndUpdate(filter, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, subcategories: { $addToSet: '$subcategory' } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No images uploaded' });

    const hasCloudinaryConfig = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    if (!hasCloudinaryConfig) {
      return res.status(500).json({
        success: false,
        message: 'Image upload is not configured on the server. Add Cloudinary environment variables in Vercel.',
      });
    }

    const uploadFile = file => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'homeconnect/properties',
          resource_type: 'image',
          transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      stream.end(file.buffer);
    });

    const images = await Promise.all(req.files.map(uploadFile));
    res.json({ success: true, images });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No video file uploaded' });
    const video = { url: `/uploads/${req.file.filename}`, title: req.body.title || 'Property Tour' };
    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
