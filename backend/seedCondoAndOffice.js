const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const connectDB = require('./config/db');

const condominiums = [
  {
    name: '3 BHK Luxury Condominium in Bandra Kurla Complex, Mumbai',
    slug: '3bhk-luxury-condominium-bkc-mumbai',
    description: 'Prestigious 3 BHK condominium in the heart of Bandra Kurla Complex (BKC), Mumbai\'s premier business and residential hub. This high-floor unit offers sweeping skyline views, Italian marble flooring, a chef\'s modular kitchen, three spacious bedrooms with walk-in wardrobes, and two large balconies. The luxury tower provides 5-star amenities: concierge service, infinity rooftop pool, sky lounge, valet parking, and a private cinema room.',
    shortDescription: 'High-floor 3 BHK luxury condo with skyline views and 5-star amenities in BKC Mumbai.',
    price: 55000000,
    discountPrice: 52000000,
    category: 'Condominium',
    subcategory: '3 BHK Condo',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1614596783969-e784059c1c21?w=800', publicId: 'condo-bkc-1' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', publicId: 'condo-bkc-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/IhJ5MpLDhGo', title: '3 BHK Luxury Condo Tour — BKC Mumbai' },
      { url: 'https://www.youtube.com/embed/nSpxJ-8vJHc', title: 'Tower Amenities Walkthrough — BKC Mumbai' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Luxury Condominium' },
      { key: 'BHK', value: '3 BHK' },
      { key: 'Area', value: '1950 sq.ft' },
      { key: 'Floor', value: '28th of 35' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'View', value: 'City Skyline' },
      { key: 'Amenities', value: 'Infinity Pool, Sky Lounge, Cinema Room, Concierge' },
      { key: 'Location', value: 'BKC, Mumbai' },
    ],
    tags: ['condominium', 'condo', '3bhk', 'luxury', 'bkc', 'mumbai', 'skyline view', 'residential'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 60 },
  },
  {
    name: '2 BHK Condominium in Hebbal, Bangalore',
    slug: '2bhk-condominium-hebbal-bangalore',
    description: 'Elegant 2 BHK condominium in the serene Hebbal neighbourhood of North Bangalore, offering tranquil lake views. The unit features an open-plan living area, a premium modular kitchen, two bedrooms with attached bathrooms, and a large balcony overlooking Hebbal Lake. The gated condominium complex offers a swimming pool, gymnasium, yoga deck, co-working space, and is minutes from Kempegowda International Airport.',
    shortDescription: 'Lake-view 2 BHK condo with co-working space near airport in Hebbal, Bangalore.',
    price: 14500000,
    discountPrice: 13800000,
    category: 'Condominium',
    subcategory: '2 BHK Condo',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800', publicId: 'condo-heb-1' },
      { url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', publicId: 'condo-heb-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/YHIEnSl04kE', title: '2 BHK Condo Tour — Hebbal Bangalore' },
      { url: 'https://www.youtube.com/embed/4N1iwQxiHrs', title: 'Lake View & Amenities — Hebbal Bangalore' },
    ],
    stock: 4,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Condominium' },
      { key: 'BHK', value: '2 BHK' },
      { key: 'Area', value: '1200 sq.ft' },
      { key: 'Floor', value: '12th of 20' },
      { key: 'Parking', value: '1 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'View', value: 'Hebbal Lake' },
      { key: 'Amenities', value: 'Pool, Gym, Yoga Deck, Co-working Space' },
      { key: 'Location', value: 'Hebbal, Bangalore' },
    ],
    tags: ['condominium', 'condo', '2bhk', 'lake view', 'hebbal', 'bangalore', 'airport', 'residential'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 45 },
  },
  {
    name: '4 BHK Penthouse Condominium in Cyber City, Gurgaon',
    slug: '4bhk-penthouse-condominium-cyber-city-gurgaon',
    description: 'Spectacular 4 BHK penthouse condominium in Cyber City, Gurgaon — the corporate capital of India. Spanning the entire top two floors, this duplex penthouse offers 360-degree views of the Aravalli hills and city skyline. Features include a private terrace with a plunge pool, a bespoke kitchen, four en-suite bedrooms, a home office, and a double-height living room. The tower features a dedicated penthouse elevator, butler service, and world-class amenities.',
    shortDescription: '360° view 4 BHK duplex penthouse with private pool and butler service in Cyber City Gurgaon.',
    price: 95000000,
    discountPrice: 90000000,
    category: 'Condominium',
    subcategory: '4 BHK Penthouse',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', publicId: 'condo-cc-1' },
      { url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800', publicId: 'condo-cc-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/Bg8ynSibH3g', title: '4 BHK Penthouse Condo Tour — Cyber City Gurgaon' },
      { url: 'https://www.youtube.com/embed/CyvmBHEZ45A', title: 'Penthouse Terrace & Amenities — Cyber City Gurgaon' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Penthouse Condominium' },
      { key: 'BHK', value: '4 BHK' },
      { key: 'Area', value: '4200 sq.ft' },
      { key: 'Floor', value: 'Penthouse — 30th & 31st' },
      { key: 'Parking', value: '3 Reserved' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'View', value: '360° City + Aravalli Hills' },
      { key: 'Amenities', value: 'Private Plunge Pool, Butler Service, Dedicated Elevator' },
      { key: 'Location', value: 'Cyber City, Gurgaon' },
    ],
    tags: ['condominium', 'condo', 'penthouse', '4bhk', 'luxury', 'cyber city', 'gurgaon', 'hills view'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 90 },
  },
  {
    name: '2 BHK Condominium in Hiranandani Gardens, Powai',
    slug: '2bhk-condominium-hiranandani-gardens-powai',
    description: 'Well-appointed 2 BHK condominium in the iconic Hiranandani Gardens township, Powai — Mumbai\'s most self-contained luxury neighbourhood. The flat features classic Hiranandani Greco-Roman architecture, two bedrooms, a spacious living room, a modern kitchen, and balcony. The township offers everything within walking distance: shopping malls, international schools, hospitals, restaurants, and the scenic Powai Lake promenade.',
    shortDescription: 'Classic 2 BHK condo in Hiranandani Gardens township with lake promenade, Powai Mumbai.',
    price: 22000000,
    discountPrice: 21000000,
    category: 'Condominium',
    subcategory: '2 BHK Condo',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800', publicId: 'condo-pow-1' },
      { url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800', publicId: 'condo-pow-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/tUJDhBz2RHg', title: '2 BHK Condo Tour — Hiranandani Powai Mumbai' },
    ],
    stock: 3,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Township Condominium' },
      { key: 'BHK', value: '2 BHK' },
      { key: 'Area', value: '1050 sq.ft' },
      { key: 'Floor', value: '6th of 14' },
      { key: 'Parking', value: '1 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'View', value: 'Township & Lake' },
      { key: 'Amenities', value: 'Mall, Schools, Hospital, Lake Promenade' },
      { key: 'Location', value: 'Hiranandani Gardens, Powai, Mumbai' },
    ],
    tags: ['condominium', 'condo', '2bhk', 'hiranandani', 'powai', 'mumbai', 'township', 'lake view'],
    isFeatured: false,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 45 },
  },
];

const offices = [
  {
    name: 'Premium Office Space in Nariman Point, Mumbai',
    slug: 'premium-office-space-nariman-point-mumbai',
    description: 'Grade-A commercial office space of 3500 sq.ft in the prestigious Nariman Point business district — Mumbai\'s most iconic corporate address. The fully fitted-out space includes 20 workstations, 3 private cabins, a boardroom for 12, a reception area, a pantry, and two restrooms. The building offers 24/7 access, 3 dedicated car parking slots, high-speed internet infrastructure, and stunning sea views from every floor.',
    shortDescription: 'Grade-A 3500 sq.ft fitted office with sea views in Nariman Point, Mumbai.',
    price: 75000000,
    discountPrice: 71000000,
    category: 'Office',
    subcategory: 'Commercial Office',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', publicId: 'office-np-1' },
      { url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800', publicId: 'office-np-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/YHIEnSl04kE', title: 'Grade-A Office Space Tour — Nariman Point Mumbai' },
      { url: 'https://www.youtube.com/embed/4N1iwQxiHrs', title: 'Office Amenities & Sea View — Nariman Point' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Grade-A Commercial Office' },
      { key: 'Area', value: '3500 sq.ft' },
      { key: 'Floor', value: '15th of 22' },
      { key: 'Seating Capacity', value: '20 Workstations + 3 Cabins' },
      { key: 'Parking', value: '3 Dedicated Slots' },
      { key: 'Furnishing', value: 'Fully Fitted' },
      { key: 'View', value: 'Sea View' },
      { key: 'Amenities', value: 'Boardroom, Reception, Pantry, 24/7 Access' },
      { key: 'Location', value: 'Nariman Point, Mumbai' },
    ],
    tags: ['office', 'commercial', 'grade-a', 'nariman point', 'mumbai', 'sea view', 'cbd'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: 'Co-Working Ready Office in Koramangala, Bangalore',
    slug: 'coworking-ready-office-koramangala-bangalore',
    description: 'Modern plug-and-play office space of 2000 sq.ft in the startup capital of India — Koramangala, Bangalore. The space is co-working ready with 30 hot desks, 2 private cabins, a large open collaboration zone, a podcast room, a cafeteria, and super-fast 1 Gbps internet. The building has a rooftop terrace, EV charging points in the basement, and is surrounded by the best restaurants and networking hubs in the city.',
    shortDescription: 'Plug-and-play 2000 sq.ft co-working office with 1 Gbps internet in Koramangala Bangalore.',
    price: 28000000,
    discountPrice: 26500000,
    category: 'Office',
    subcategory: 'Co-Working Office',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800', publicId: 'office-kor-1' },
      { url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800', publicId: 'office-kor-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/c5VP3C0Kplg', title: 'Co-Working Office Tour — Koramangala Bangalore' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Co-Working Office' },
      { key: 'Area', value: '2000 sq.ft' },
      { key: 'Floor', value: '4th of 8' },
      { key: 'Seating Capacity', value: '30 Hot Desks + 2 Cabins' },
      { key: 'Parking', value: '5 Slots (EV Ready)' },
      { key: 'Furnishing', value: 'Fully Fitted' },
      { key: 'Internet', value: '1 Gbps Fibre' },
      { key: 'Amenities', value: 'Cafeteria, Podcast Room, Rooftop Terrace' },
      { key: 'Location', value: 'Koramangala, Bangalore' },
    ],
    tags: ['office', 'co-working', 'startup', 'commercial', 'koramangala', 'bangalore', 'tech hub'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: 'Corporate Office Floor in DLF Cyberhub, Gurgaon',
    slug: 'corporate-office-floor-dlf-cyberhub-gurgaon',
    description: 'Entire 5000 sq.ft corporate office floor in the iconic DLF Cyberhub, Gurgaon — India\'s most sought-after corporate address. The space features an open-plan office for 50 employees, 5 glass-walled cabins, two large conference rooms, a business lounge, a server room, and premium cafeteria facilities. The building has state-of-the-art BMS, LEED-certified infrastructure, dedicated power backup, and direct metro connectivity.',
    shortDescription: 'Full 5000 sq.ft corporate floor for 50 seats in DLF Cyberhub — Gurgaon\'s top business address.',
    price: 120000000,
    discountPrice: 115000000,
    category: 'Office',
    subcategory: 'Corporate Office',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800', publicId: 'office-dlf-1' },
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', publicId: 'office-dlf-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/Bg8ynSibH3g', title: 'Corporate Office Floor Tour — DLF Cyberhub Gurgaon' },
      { url: 'https://www.youtube.com/embed/IhJ5MpLDhGo', title: 'Building Amenities — DLF Cyberhub Gurgaon' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Corporate Office Floor' },
      { key: 'Area', value: '5000 sq.ft' },
      { key: 'Floor', value: '9th of 18' },
      { key: 'Seating Capacity', value: '50 Seats + 5 Cabins' },
      { key: 'Parking', value: '10 Dedicated Slots' },
      { key: 'Furnishing', value: 'Fully Fitted (LEED)' },
      { key: 'Connectivity', value: 'Metro Direct Access' },
      { key: 'Amenities', value: 'Conference Rooms, Business Lounge, BMS, Power Backup' },
      { key: 'Location', value: 'DLF Cyberhub, Gurgaon' },
    ],
    tags: ['office', 'corporate', 'commercial', 'dlf', 'cyberhub', 'gurgaon', 'leed', 'metro'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: 'Small Business Office in T. Nagar, Chennai',
    slug: 'small-business-office-t-nagar-chennai',
    description: 'Compact yet well-designed 800 sq.ft office space in T. Nagar, Chennai\'s bustling commercial hub. Ideal for small businesses, startups, or satellite offices. The space includes 8 workstations, a private cabin, a meeting room for 6, a reception desk, and a pantry. Located in a modern commercial building with lift access, generator backup, and covered parking. Surrounded by banks, post offices, and excellent public transport connections.',
    shortDescription: 'Ready-to-move 800 sq.ft small business office in T. Nagar commercial hub, Chennai.',
    price: 9500000,
    discountPrice: 9000000,
    category: 'Office',
    subcategory: 'Small Business Office',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', publicId: 'office-tn-1' },
      { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800', publicId: 'office-tn-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/tUJDhBz2RHg', title: 'Small Business Office Tour — T. Nagar Chennai' },
    ],
    stock: 3,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Small Business Office' },
      { key: 'Area', value: '800 sq.ft' },
      { key: 'Floor', value: '3rd of 6' },
      { key: 'Seating Capacity', value: '8 Workstations + 1 Cabin' },
      { key: 'Parking', value: '1 Covered' },
      { key: 'Furnishing', value: 'Partially Fitted' },
      { key: 'Power', value: 'Generator Backup' },
      { key: 'Amenities', value: 'Meeting Room, Reception, Pantry' },
      { key: 'Location', value: 'T. Nagar, Chennai' },
    ],
    tags: ['office', 'small business', 'startup', 'commercial', 't nagar', 'chennai', 'affordable'],
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

  const delC = await Product.deleteMany({ category: 'Condominium' });
  const delO = await Product.deleteMany({ category: 'Office' });
  console.log(`Cleared ${delC.deletedCount} Condominium + ${delO.deletedCount} Office listings.`);

  const allDocs = [...condominiums, ...offices].map(d => ({ ...d, seller: seller._id }));
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
