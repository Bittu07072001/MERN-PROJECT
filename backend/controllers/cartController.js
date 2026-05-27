const { Cart, Wishlist } = require('../models/index');
const Product = require('../models/Product');

// ─── CART ─────────────────────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price discountPrice images stock isActive approvalStatus');
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    // Remove items whose products are inactive or not yet approved
    cart.items = cart.items.filter(i => i.product?.isActive && i.product?.approvalStatus === 'approved');
    cart.items.splice(1);
    cart.items.forEach(item => { item.quantity = 1; });
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive || product.approvalStatus !== 'approved')
      return res.status(404).json({ success: false, message: 'Product not found or not available' });
    if (product.stock < 1)
      return res.status(400).json({ success: false, message: 'Property is out of stock' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    cart.items = [{ product: productId, quantity: 1 }];

    await cart.save();
    await cart.populate('items.product', 'name price discountPrice images stock');
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const idx = cart.items.findIndex(i => i.product.toString() === req.params.productId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item not in cart' });

    if (quantity <= 0) cart.items.splice(idx, 1);
    else cart.items[idx].quantity = 1;

    await cart.save();
    await cart.populate('items.product', 'name price discountPrice images stock');
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { items: { product: req.params.productId } } },
      { new: true }
    ).populate('items.product', 'name price discountPrice images stock');
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products', 'name price discountPrice images ratings isActive');
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    res.json({ success: true, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });

    const exists = wishlist.products.some(p => p.toString() === productId);
    if (exists) {
      wishlist.products = wishlist.products.filter(p => p.toString() !== productId);
    } else {
      wishlist.products.push(productId);
    }

    await wishlist.save();
    res.json({ success: true, added: !exists, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
