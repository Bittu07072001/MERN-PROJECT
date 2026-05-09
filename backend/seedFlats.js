const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');

const connectDB = require('./config/db');

const flats = [
  // ── 1 BHK ──────────────────────────────────────────────────────────────────
  {
    name: '1 BHK Apartment in Andheri West',
    slug: '1bhk-apartment-andheri-west',
    description: 'A cozy and well-ventilated 1 BHK flat located in the heart of Andheri West, Mumbai. The unit features a spacious living room, a fully tiled kitchen, a modern bathroom, and one bedroom with ample natural light. Ideal for bachelors or young couples.',
    shortDescription: 'Cozy 1 BHK flat in Andheri West with all modern amenities.',
    price: 6500000,
    discountPrice: 6200000,
    category: 'Flat',
    subcategory: '1 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', publicId: '1bhk-1' },
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', publicId: '1bhk-2' },
    ],
    stock: 3,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '1 BHK' },
      { key: 'Area', value: '550 sq.ft' },
      { key: 'Floor', value: '4th of 10' },
      { key: 'Parking', value: '1 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'Facing', value: 'East' },
      { key: 'Age of Property', value: '3 Years' },
      { key: 'Location', value: 'Andheri West, Mumbai' },
    ],
    tags: ['1bhk', 'flat', 'apartment', 'mumbai', 'andheri', 'residential'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: '1 BHK Flat in Koramangala, Bangalore',
    slug: '1bhk-flat-koramangala-bangalore',
    description: 'Modern 1 BHK flat situated in Koramangala, one of Bangalore\'s most sought-after localities. Close to IT parks, malls, and restaurants. The apartment has a open kitchen concept and a private balcony with city views.',
    shortDescription: 'Modern 1 BHK near IT parks in Koramangala, Bangalore.',
    price: 5800000,
    discountPrice: 5500000,
    category: 'Flat',
    subcategory: '1 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', publicId: '1bhk-blr-1' },
      { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', publicId: '1bhk-blr-2' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '1 BHK' },
      { key: 'Area', value: '580 sq.ft' },
      { key: 'Floor', value: '2nd of 8' },
      { key: 'Parking', value: '1 Open' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Facing', value: 'North' },
      { key: 'Age of Property', value: '2 Years' },
      { key: 'Location', value: 'Koramangala, Bangalore' },
    ],
    tags: ['1bhk', 'flat', 'apartment', 'bangalore', 'koramangala', 'residential'],
    isFeatured: false,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },

  // ── 2 BHK ──────────────────────────────────────────────────────────────────
  {
    name: '2 BHK Apartment in Powai, Mumbai',
    slug: '2bhk-apartment-powai-mumbai',
    description: 'Spacious 2 BHK apartment in the prestigious Powai area of Mumbai, overlooking the Powai Lake. The flat includes two large bedrooms, a master bathroom, a separate living and dining area, and a modular kitchen. Society amenities include a swimming pool, gym, and 24/7 security.',
    shortDescription: 'Lake-view 2 BHK in Powai with premium society amenities.',
    price: 13500000,
    discountPrice: 12800000,
    category: 'Flat',
    subcategory: '2 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', publicId: '2bhk-mum-1' },
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', publicId: '2bhk-mum-2' },
    ],
    stock: 4,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '2 BHK' },
      { key: 'Area', value: '950 sq.ft' },
      { key: 'Floor', value: '8th of 15' },
      { key: 'Parking', value: '1 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'Facing', value: 'West (Lake View)' },
      { key: 'Age of Property', value: '5 Years' },
      { key: 'Location', value: 'Powai, Mumbai' },
    ],
    tags: ['2bhk', 'flat', 'apartment', 'mumbai', 'powai', 'lake view', 'residential'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 45 },
  },
  {
    name: '2 BHK Flat in Whitefield, Bangalore',
    slug: '2bhk-flat-whitefield-bangalore',
    description: 'Well-designed 2 BHK flat in Whitefield, Bangalore\'s premier IT corridor. This apartment features Italian marble flooring, a modular kitchen, two spacious bedrooms with wardrobes, and a balcony. The gated complex offers a clubhouse, kids\' play area, and jogging track.',
    shortDescription: 'Premium 2 BHK in Whitefield IT corridor with clubhouse amenities.',
    price: 10200000,
    discountPrice: 9800000,
    category: 'Flat',
    subcategory: '2 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800', publicId: '2bhk-blr-1' },
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', publicId: '2bhk-blr-2' },
    ],
    stock: 5,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '2 BHK' },
      { key: 'Area', value: '1050 sq.ft' },
      { key: 'Floor', value: '5th of 12' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Facing', value: 'South-East' },
      { key: 'Age of Property', value: 'New' },
      { key: 'Location', value: 'Whitefield, Bangalore' },
    ],
    tags: ['2bhk', 'flat', 'apartment', 'bangalore', 'whitefield', 'residential'],
    isFeatured: false,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 45 },
  },
  {
    name: '2 BHK Apartment in Gurgaon Sector 56',
    slug: '2bhk-apartment-gurgaon-sector-56',
    description: 'Elegant 2 BHK apartment in the upscale Sector 56, Gurgaon. Strategically located near Golf Course Road, the unit has a premium interior finish, open kitchen, large windows, and a balcony. The complex features a rooftop garden, gym, and indoor games room.',
    shortDescription: 'Elegant 2 BHK near Golf Course Road, Gurgaon with rooftop garden.',
    price: 11000000,
    discountPrice: 10500000,
    category: 'Flat',
    subcategory: '2 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', publicId: '2bhk-grg-1' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', publicId: '2bhk-grg-2' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '2 BHK' },
      { key: 'Area', value: '1100 sq.ft' },
      { key: 'Floor', value: '10th of 18' },
      { key: 'Parking', value: '1 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'Facing', value: 'North-West' },
      { key: 'Age of Property', value: '1 Year' },
      { key: 'Location', value: 'Sector 56, Gurgaon' },
    ],
    tags: ['2bhk', 'flat', 'apartment', 'gurgaon', 'golf course road', 'residential'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 45 },
  },

  // ── 3 BHK ──────────────────────────────────────────────────────────────────
  {
    name: '3 BHK Luxury Flat in Bandra, Mumbai',
    slug: '3bhk-luxury-flat-bandra-mumbai',
    description: 'Stunning 3 BHK luxury apartment in Bandra West, the queen of Mumbai suburbs. This premium flat offers panoramic sea views, high-end finishes, a large living room, three well-appointed bedrooms, a chef\'s kitchen, and two balconies. World-class society amenities include a rooftop infinity pool, spa, concierge, and private theatre.',
    shortDescription: 'Panoramic sea-view 3 BHK luxury flat in Bandra West, Mumbai.',
    price: 42000000,
    discountPrice: 39500000,
    category: 'Flat',
    subcategory: '3 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', publicId: '3bhk-mum-1' },
      { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', publicId: '3bhk-mum-2' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '3 BHK' },
      { key: 'Area', value: '1800 sq.ft' },
      { key: 'Floor', value: '18th of 22' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Facing', value: 'West (Sea View)' },
      { key: 'Age of Property', value: 'New' },
      { key: 'Location', value: 'Bandra West, Mumbai' },
    ],
    tags: ['3bhk', 'flat', 'luxury', 'apartment', 'mumbai', 'bandra', 'sea view', 'residential'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 60 },
  },
  {
    name: '3 BHK Apartment in Indiranagar, Bangalore',
    slug: '3bhk-apartment-indiranagar-bangalore',
    description: 'Premium 3 BHK apartment in the trendy Indiranagar neighbourhood of Bangalore. The flat spans 1650 sq.ft with three large bedrooms, two bathrooms, a modern kitchen, and a wrap-around balcony. Located minutes from 100 Feet Road\'s restaurants and boutiques. The complex provides a well-equipped gym, swimming pool, and 24/7 security.',
    shortDescription: 'Premium 3 BHK in the heart of Indiranagar, Bangalore.',
    price: 18500000,
    discountPrice: 17800000,
    category: 'Flat',
    subcategory: '3 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800', publicId: '3bhk-blr-1' },
      { url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800', publicId: '3bhk-blr-2' },
    ],
    stock: 3,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '3 BHK' },
      { key: 'Area', value: '1650 sq.ft' },
      { key: 'Floor', value: '6th of 14' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'Facing', value: 'East' },
      { key: 'Age of Property', value: '2 Years' },
      { key: 'Location', value: 'Indiranagar, Bangalore' },
    ],
    tags: ['3bhk', 'flat', 'apartment', 'bangalore', 'indiranagar', 'residential'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 60 },
  },
  {
    name: '3 BHK Flat in DLF Phase 3, Gurgaon',
    slug: '3bhk-flat-dlf-phase3-gurgaon',
    description: 'Spacious 3 BHK flat in the prestigious DLF Phase 3 township, Gurgaon. The apartment has a grand entrance foyer, a large living room, three bedrooms with attached bathrooms, a utility room, and a servant\'s quarter. Premium amenities include a clubhouse, squash court, tennis court, and beautifully landscaped gardens.',
    shortDescription: 'Spacious 3 BHK in DLF Phase 3 township with tennis & squash courts.',
    price: 22000000,
    discountPrice: 21000000,
    category: 'Flat',
    subcategory: '3 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800', publicId: '3bhk-grg-1' },
      { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', publicId: '3bhk-grg-2' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '3 BHK' },
      { key: 'Area', value: '2000 sq.ft' },
      { key: 'Floor', value: '3rd of 6 (Villa Style)' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Unfurnished' },
      { key: 'Facing', value: 'South' },
      { key: 'Age of Property', value: '8 Years' },
      { key: 'Location', value: 'DLF Phase 3, Gurgaon' },
    ],
    tags: ['3bhk', 'flat', 'dlf', 'apartment', 'gurgaon', 'township', 'residential'],
    isFeatured: false,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 60 },
  },

  // ── 4 BHK ──────────────────────────────────────────────────────────────────
  {
    name: '4 BHK Penthouse in Juhu, Mumbai',
    slug: '4bhk-penthouse-juhu-mumbai',
    description: 'Extraordinary 4 BHK penthouse in the iconic Juhu beach area of Mumbai. This ultra-premium duplex penthouse spans 4000 sq.ft across two levels with a private terrace overlooking the Arabian Sea. Features include home automation, private plunge pool on the terrace, a gourmet kitchen, four en-suite bedrooms, a home theatre, and a private lift. The building offers concierge services, valet parking, and a helipad.',
    shortDescription: 'Ultra-premium 4 BHK duplex penthouse with sea view & private pool in Juhu.',
    price: 120000000,
    discountPrice: 115000000,
    category: 'Flat',
    subcategory: '4 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800', publicId: '4bhk-mum-1' },
      { url: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800', publicId: '4bhk-mum-2' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '4 BHK' },
      { key: 'Area', value: '4000 sq.ft' },
      { key: 'Floor', value: 'Penthouse — 21st & 22nd' },
      { key: 'Parking', value: '3 Covered + Valet' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Facing', value: 'West (Sea View)' },
      { key: 'Age of Property', value: 'New' },
      { key: 'Location', value: 'Juhu, Mumbai' },
    ],
    tags: ['4bhk', 'penthouse', 'luxury', 'flat', 'apartment', 'mumbai', 'juhu', 'sea view', 'residential'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 90 },
  },
  {
    name: '4 BHK Villa-Style Apartment in Sarjapur Road, Bangalore',
    slug: '4bhk-villa-apartment-sarjapur-road-bangalore',
    description: 'Grand 4 BHK villa-style apartment in the fast-developing Sarjapur Road corridor of Bangalore. The sprawling flat features a double-height living room, four spacious bedrooms including a master suite with walk-in wardrobe, a private garden on the ground floor, and a study room. The luxury township boasts a cricket pitch, Olympic-size pool, yoga studio, and a business centre.',
    shortDescription: 'Grand 4 BHK villa-style flat with private garden in Sarjapur Road township.',
    price: 35000000,
    discountPrice: 33000000,
    category: 'Flat',
    subcategory: '4 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', publicId: '4bhk-blr-1' },
      { url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', publicId: '4bhk-blr-2' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '4 BHK' },
      { key: 'Area', value: '3200 sq.ft' },
      { key: 'Floor', value: 'Ground + 1st (Duplex)' },
      { key: 'Parking', value: '3 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'Facing', value: 'East' },
      { key: 'Age of Property', value: 'New' },
      { key: 'Location', value: 'Sarjapur Road, Bangalore' },
    ],
    tags: ['4bhk', 'villa', 'flat', 'luxury', 'apartment', 'bangalore', 'sarjapur', 'residential'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 90 },
  },
  {
    name: '4 BHK Apartment in Golf Course Extension, Gurgaon',
    slug: '4bhk-apartment-golf-course-extension-gurgaon',
    description: 'Magnificent 4 BHK apartment overlooking the golf course in the most coveted address of Gurgaon — Golf Course Extension Road. The luxury flat features designer interiors, four bedrooms with en-suite bathrooms, a formal dining room, a family lounge, and two balconies. Society amenities include a 9-hole putting green, infinity pool, business lounge, and fine-dining restaurant.',
    shortDescription: 'Golf-course view 4 BHK luxury flat on Golf Course Extension Road, Gurgaon.',
    price: 55000000,
    discountPrice: 52000000,
    category: 'Flat',
    subcategory: '4 BHK',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', publicId: '4bhk-grg-1' },
      { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', publicId: '4bhk-grg-2' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'BHK Type', value: '4 BHK' },
      { key: 'Area', value: '3500 sq.ft' },
      { key: 'Floor', value: '12th of 20' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Facing', value: 'West (Golf View)' },
      { key: 'Age of Property', value: '1 Year' },
      { key: 'Location', value: 'Golf Course Extension, Gurgaon' },
    ],
    tags: ['4bhk', 'flat', 'luxury', 'apartment', 'gurgaon', 'golf course', 'residential'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 90 },
  },
];

async function seed() {
  await connectDB();

  // Find or create a seller/admin user to own the listings
  let seller = await User.findOne({ role: { $in: ['admin', 'seller'] } });

  if (!seller) {
    console.log('No seller found — creating default admin seller...');
    seller = await User.create({
      name: 'HomeConnect Admin',
      email: 'admin@homeconnect.com',
      password: 'Admin@12345',
      role: 'admin',
      isEmailVerified: true,
    });
    console.log(`Created admin seller: ${seller.email}`);
  } else {
    console.log(`Using existing seller: ${seller.email} (${seller.role})`);
  }

  // Remove any previous flat listings to avoid duplicates
  const deleted = await Product.deleteMany({ category: 'Flat' });
  console.log(`Cleared ${deleted.deletedCount} existing Flat listings.`);

  // Inject seller id
  const docs = flats.map(f => ({ ...f, seller: seller._id }));
  const inserted = await Product.insertMany(docs);
  console.log(`✅ Inserted ${inserted.length} Flat listings successfully!`);

  inserted.forEach(p => console.log(`  • [${p.subcategory}] ${p.name} — ₹${p.price.toLocaleString('en-IN')}`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
