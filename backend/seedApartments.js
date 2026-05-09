const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const connectDB = require('./config/db');

const apartments = [
  {
    name: '1 BHK Affordable Apartment in Thane West, Mumbai',
    slug: '1bhk-affordable-apartment-thane-west-mumbai',
    description: 'Well-designed 1 BHK apartment in the fast-growing suburb of Thane West, offering excellent connectivity to Mumbai via train and expressway. The apartment features a compact living room, a separate kitchen, a bedroom with built-in wardrobe, and a balcony. The complex offers security, a children\'s play area, and is walking distance from Thane railway station, malls, and hospitals. An ideal first home or investment property.',
    shortDescription: 'Affordable 1 BHK apartment near Thane railway station with all amenities.',
    price: 6500000,
    discountPrice: 6200000,
    category: 'Apartments',
    subcategory: '1 BHK Apartment',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800', publicId: 'apt-thane-1' },
      { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', publicId: 'apt-thane-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/tUJDhBz2RHg', title: '1 BHK Apartment Tour — Thane West Mumbai' },
    ],
    stock: 6,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Apartment' },
      { key: 'BHK', value: '1 BHK' },
      { key: 'Area', value: '580 sq.ft' },
      { key: 'Floor', value: '5th of 12' },
      { key: 'Parking', value: '1 Open' },
      { key: 'Furnishing', value: 'Unfurnished' },
      { key: 'Possession', value: 'Ready to Move' },
      { key: 'Amenities', value: 'Security, Play Area, Lift' },
      { key: 'Location', value: 'Thane West, Mumbai' },
    ],
    tags: ['apartment', '1bhk', 'affordable', 'thane', 'mumbai', 'first home', 'investment'],
    isFeatured: false,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: '2 BHK Apartment in Indiranagar, Bangalore',
    slug: '2bhk-apartment-indiranagar-bangalore',
    description: 'Stylish 2 BHK apartment in the premium Indiranagar neighbourhood — Bangalore\'s most vibrant residential and social district. The apartment features an open-plan living and dining area, a contemporary kitchen, two bedrooms, two bathrooms, and a wrap-around balcony with tree-top views. Located in a boutique 12-storey building with a rooftop garden, a gym, and covered parking. Walking distance to the metro, restaurants, and 100 Feet Road.',
    shortDescription: 'Stylish 2 BHK apartment with rooftop garden in prime Indiranagar, Bangalore.',
    price: 17500000,
    discountPrice: 16800000,
    category: 'Apartments',
    subcategory: '2 BHK Apartment',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=800', publicId: 'apt-ind-1' },
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', publicId: 'apt-ind-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/IhJ5MpLDhGo', title: '2 BHK Apartment Tour — Indiranagar Bangalore' },
      { url: 'https://www.youtube.com/embed/4N1iwQxiHrs', title: 'Rooftop Garden & Amenities — Indiranagar Bangalore' },
    ],
    stock: 3,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Apartment' },
      { key: 'BHK', value: '2 BHK' },
      { key: 'Area', value: '1100 sq.ft' },
      { key: 'Floor', value: '8th of 12' },
      { key: 'Parking', value: '1 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'View', value: 'Tree-top View' },
      { key: 'Amenities', value: 'Rooftop Garden, Gym, Covered Parking, Metro Nearby' },
      { key: 'Location', value: 'Indiranagar, Bangalore' },
    ],
    tags: ['apartment', '2bhk', 'indiranagar', 'bangalore', 'metro', 'premium', 'residential'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 45 },
  },
  {
    name: '3 BHK Apartment in Sector 56, Gurgaon',
    slug: '3bhk-apartment-sector-56-gurgaon',
    description: 'Spacious 3 BHK apartment in the well-established Sector 56, Gurgaon — close to Golf Course Road and major corporate hubs. The apartment spans 1800 sq.ft with a large living room, a formal dining area, a fully equipped kitchen, three well-sized bedrooms, and two balconies overlooking a landscaped park. The high-rise complex features a swimming pool, a clubhouse, a tennis court, power backup, and ample visitor parking.',
    shortDescription: 'Spacious 3 BHK apartment with park view and clubhouse in Sector 56, Gurgaon.',
    price: 19500000,
    discountPrice: 18500000,
    category: 'Apartments',
    subcategory: '3 BHK Apartment',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', publicId: 'apt-grg-1' },
      { url: 'https://images.unsplash.com/photo-1560185127-6a4a420fcf63?w=800', publicId: 'apt-grg-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/YHIEnSl04kE', title: '3 BHK Apartment Tour — Sector 56 Gurgaon' },
      { url: 'https://www.youtube.com/embed/Bg8ynSibH3g', title: 'Park View & Complex Amenities — Sector 56 Gurgaon' },
    ],
    stock: 4,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Apartment' },
      { key: 'BHK', value: '3 BHK' },
      { key: 'Area', value: '1800 sq.ft' },
      { key: 'Floor', value: '10th of 18' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'View', value: 'Landscaped Park' },
      { key: 'Amenities', value: 'Pool, Clubhouse, Tennis Court, Power Backup' },
      { key: 'Location', value: 'Sector 56, Gurgaon' },
    ],
    tags: ['apartment', '3bhk', 'sector 56', 'gurgaon', 'golf course road', 'park view', 'residential'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 45 },
  },
  {
    name: '2 BHK Sea-View Apartment in Adyar, Chennai',
    slug: '2bhk-sea-view-apartment-adyar-chennai',
    description: 'Beautifully appointed 2 BHK apartment with stunning Bay of Bengal sea views in the upmarket Adyar neighbourhood of Chennai. The flat features a bright, airy living room, a semi-modular kitchen, two bedrooms, and a large balcony from which you can enjoy unobstructed sea views. The complex has a rooftop infinity pool, a gym, a community hall, and is minutes from Elliot\'s Beach, fine dining, and reputed schools.',
    shortDescription: '2 BHK sea-view apartment with rooftop infinity pool near Elliot\'s Beach, Adyar Chennai.',
    price: 13500000,
    discountPrice: 12900000,
    category: 'Apartments',
    subcategory: '2 BHK Apartment',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800', publicId: 'apt-adyar-1' },
      { url: 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800', publicId: 'apt-adyar-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/c5VP3C0Kplg', title: '2 BHK Sea-View Apartment Tour — Adyar Chennai' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Apartment' },
      { key: 'BHK', value: '2 BHK' },
      { key: 'Area', value: '1050 sq.ft' },
      { key: 'Floor', value: '14th of 16' },
      { key: 'Parking', value: '1 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'View', value: 'Bay of Bengal Sea View' },
      { key: 'Amenities', value: 'Rooftop Infinity Pool, Gym, Community Hall' },
      { key: 'Location', value: 'Adyar, Chennai' },
    ],
    tags: ['apartment', '2bhk', 'sea view', 'adyar', 'chennai', 'beach', 'luxury', 'residential'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: '3 BHK Premium Apartment in Juhu, Mumbai',
    slug: '3bhk-premium-apartment-juhu-mumbai',
    description: 'Sophisticated 3 BHK premium apartment in the star-studded Juhu neighbourhood of Mumbai — home to Bollywood celebrities and iconic beach vibes. The 1650 sq.ft apartment features walnut-finish interiors, a chef-grade kitchen, three bedrooms with king-size beds, a home office nook, and a large balcony. The exclusive low-rise building has only 6 units per floor, a private gym, spa, concierge service, and is steps from Juhu Beach.',
    shortDescription: 'Premium 3 BHK apartment steps from Juhu Beach with spa and concierge in Mumbai.',
    price: 48000000,
    discountPrice: 45500000,
    category: 'Apartments',
    subcategory: '3 BHK Apartment',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600210491892-03d54079b5d4?w=800', publicId: 'apt-juhu-1' },
      { url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', publicId: 'apt-juhu-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/nSpxJ-8vJHc', title: '3 BHK Premium Apartment Tour — Juhu Mumbai' },
      { url: 'https://www.youtube.com/embed/CyvmBHEZ45A', title: 'Beachside Lifestyle — Juhu Mumbai' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Premium Apartment' },
      { key: 'BHK', value: '3 BHK' },
      { key: 'Area', value: '1650 sq.ft' },
      { key: 'Floor', value: '7th of 9' },
      { key: 'Parking', value: '2 Covered (Valet)' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'View', value: 'Juhu Beach Partial View' },
      { key: 'Amenities', value: 'Private Gym, Spa, Concierge, Low-Rise Exclusivity' },
      { key: 'Location', value: 'Juhu, Mumbai' },
    ],
    tags: ['apartment', '3bhk', 'premium', 'juhu', 'mumbai', 'beach', 'luxury', 'bollywood'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: '1 BHK Studio Apartment in Electronic City, Bangalore',
    slug: '1bhk-studio-apartment-electronic-city-bangalore',
    description: 'Compact and smart 1 BHK studio apartment in Electronic City Phase 1 — Bangalore\'s largest IT hub hosting Infosys, Wipro, HCL, and hundreds of tech companies. Purpose-built for working professionals, the apartment has a studio-style layout with a combined living and sleeping area, a modular kitchen, a modern bathroom, and access to a shared workspace in the building. Includes 24/7 security, high-speed internet, a cafeteria, and direct access to the elevated expressway.',
    shortDescription: 'Smart 1 BHK studio with co-working space for IT professionals in Electronic City, Bangalore.',
    price: 4800000,
    discountPrice: 4500000,
    category: 'Apartments',
    subcategory: '1 BHK Apartment',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', publicId: 'apt-elc-1' },
      { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', publicId: 'apt-elc-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/4N1iwQxiHrs', title: '1 BHK Studio Apartment Tour — Electronic City Bangalore' },
    ],
    stock: 8,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Studio Apartment' },
      { key: 'BHK', value: '1 BHK' },
      { key: 'Area', value: '480 sq.ft' },
      { key: 'Floor', value: '3rd of 10' },
      { key: 'Parking', value: '1 Open' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Internet', value: '200 Mbps Included' },
      { key: 'Amenities', value: 'Co-working Space, Cafeteria, Security, Expressway Access' },
      { key: 'Location', value: 'Electronic City Phase 1, Bangalore' },
    ],
    tags: ['apartment', '1bhk', 'studio', 'electronic city', 'bangalore', 'it hub', 'professional', 'affordable'],
    isFeatured: false,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 15 },
  },
];

async function seed() {
  await connectDB();

  let seller = await User.findOne({ role: { $in: ['admin', 'seller'] } });
  if (!seller) {
    seller = await User.create({
      name: 'HomeConnect Admin',
      email: 'admin@homeconnect.com',
      password: 'Admin@12345',
      role: 'admin',
      isEmailVerified: true,
    });
    console.log(`Created admin seller: ${seller.email}`);
  } else {
    console.log(`Using seller: ${seller.email}`);
  }

  const del = await Product.deleteMany({ category: 'Apartments' });
  console.log(`Cleared ${del.deletedCount} Apartments listings.`);

  const allDocs = apartments.map(d => ({ ...d, seller: seller._id }));
  const inserted = await Product.insertMany(allDocs);
  console.log(`\n✅ Inserted ${inserted.length} listings:\n`);
  inserted.forEach(p =>
    console.log(`  • [${p.category} — ${p.subcategory}] ${p.name} — ₹${p.price.toLocaleString('en-IN')}`)
  );

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
