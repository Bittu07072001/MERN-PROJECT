const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const { cloudinary } = require('./middleware/upload');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const User = require('./models/User');

const IMAGE_SOURCES = {
  villaJubilee: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=900&fit=crop&auto=format&q=85',
  condoKolkata: 'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=1200&h=900&fit=crop&auto=format&q=85',
  condoPune: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1200&h=900&fit=crop&auto=format&q=85',
  plotDevanahalli: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=900&fit=crop&auto=format&q=85',
  plotShankarpally: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&h=900&fit=crop&auto=format&q=85',
  flatViman: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=900&fit=crop&auto=format&q=85',
  flatRajarhat: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&h=900&fit=crop&auto=format&q=85',
  flatKharadi: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&h=900&fit=crop&auto=format&q=85',
  flatMadhapur: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=900&fit=crop&auto=format&q=85',
  flatJaipur: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&h=900&fit=crop&auto=format&q=85',
  flatSaltLake: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=900&fit=crop&auto=format&q=85',
  studioHsr: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=900&fit=crop&auto=format&q=85',
  studioKoregaon: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=900&fit=crop&auto=format&q=85',
  commercialAhmedabad: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=900&fit=crop&auto=format&q=85',
  commercialChennai: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=900&fit=crop&auto=format&q=85',
  officeMumbai: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=900&fit=crop&auto=format&q=85',
  officeHyderabad: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=900&fit=crop&auto=format&q=85',
  penthouseMumbai: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=900&fit=crop&auto=format&q=85',
  penthouseGurgaon: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&h=900&fit=crop&auto=format&q=85',
  apartmentPune: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&h=900&fit=crop&auto=format&q=85',
  apartmentChennai: 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=1200&h=900&fit=crop&auto=format&q=85',
};

const base = {
  brand: 'HomeConnect Realty',
  unit: 'unit',
  stock: 2,
  isActive: true,
  approvalStatus: 'approved',
  shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
};

const loc = (city, state, address, pincode = '') => ({ city, state, address, pincode });

const attrs = (items) => Object.entries(items).map(([key, value]) => ({ key, value }));

const listing = (doc) => ({
  ...base,
  ...doc,
  tags: doc.tags || [
    doc.category.toLowerCase(),
    doc.subcategory.toLowerCase(),
    doc.location.city.toLowerCase(),
    'property',
    'real estate',
  ],
});

const listings = [
  listing({
    name: '5 BHK Courtyard Villa in Jubilee Hills Hyderabad',
    slug: '5bhk-courtyard-villa-jubilee-hills-hyderabad',
    category: 'Villa',
    subcategory: '5 BHK Villa',
    description: 'A private 5 BHK villa in Jubilee Hills with a central courtyard, double-height living room, landscaped deck, theatre room, and four-car parking.',
    shortDescription: 'Private 5 BHK villa with courtyard and premium lifestyle spaces in Jubilee Hills.',
    price: 98000000,
    discountPrice: 94000000,
    location: loc('Hyderabad', 'Telangana', 'Jubilee Hills Road No. 45', '500033'),
    attributes: attrs({ 'Property Type': 'Independent Villa', BHK: '5 BHK', Area: '6200 sq.ft', Parking: '4 Covered', Furnishing: 'Fully Furnished' }),
    imageKey: 'villaJubilee',
    isFeatured: true,
    isTrending: true,
  }),
  listing({
    name: '2 BHK Garden Condominium in New Town Kolkata',
    slug: '2bhk-garden-condominium-new-town-kolkata',
    category: 'Condominium',
    subcategory: '2 BHK Condo',
    description: 'A bright garden-facing condominium in New Town with a modular kitchen, balcony, clubhouse, swimming pool, and quick access to the IT corridor.',
    shortDescription: 'Garden-facing 2 BHK condominium with clubhouse in New Town Kolkata.',
    price: 9200000,
    discountPrice: 8800000,
    location: loc('Kolkata', 'West Bengal', 'Action Area I, New Town', '700156'),
    attributes: attrs({ 'Property Type': 'Condominium', BHK: '2 BHK', Area: '1120 sq.ft', Floor: '7th of 18', Amenities: 'Pool, Clubhouse, Gym' }),
    imageKey: 'condoKolkata',
    isFeatured: true,
  }),
  listing({
    name: '3 BHK Skyline Condominium in Wakad Pune',
    slug: '3bhk-skyline-condominium-wakad-pune',
    category: 'Condominium',
    subcategory: '3 BHK Condo',
    description: 'A premium 3 BHK condominium in Wakad with skyline views, smart home features, two balconies, covered parking, and township amenities.',
    shortDescription: 'Smart 3 BHK skyline condominium in Wakad with township amenities.',
    price: 16800000,
    discountPrice: 16000000,
    location: loc('Pune', 'Maharashtra', 'Wakad Main Road', '411057'),
    attributes: attrs({ 'Property Type': 'Condominium', BHK: '3 BHK', Area: '1580 sq.ft', Floor: '15th of 24', Parking: '2 Covered' }),
    imageKey: 'condoPune',
    isTrending: true,
  }),
  listing({
    name: 'Residential Plot in Devanahalli Bangalore',
    slug: 'residential-plot-devanahalli-bangalore',
    category: 'Plot',
    subcategory: 'Residential Plot',
    description: 'A 2400 sq.ft residential plot in a planned Devanahalli layout near the airport with clear title, 30 ft roads, water lines, and street lighting.',
    shortDescription: 'Airport-side 2400 sq.ft residential plot in Devanahalli.',
    price: 7800000,
    discountPrice: 7350000,
    stock: 4,
    unit: 'plot',
    location: loc('Bangalore', 'Karnataka', 'Devanahalli Airport Road', '562110'),
    attributes: attrs({ 'Plot Type': 'Residential', Area: '2400 sq.ft', Facing: 'East', 'Road Width': '30 ft', Approval: 'DC Converted' }),
    imageKey: 'plotDevanahalli',
    isTrending: true,
  }),
  listing({
    name: 'Lake View Plot in Shankarpally Hyderabad',
    slug: 'lake-view-plot-shankarpally-hyderabad',
    category: 'Plot',
    subcategory: 'Residential Plot',
    description: 'A serene 3600 sq.ft lake-view plot in Shankarpally with gated access, underground utilities, landscaped avenues, and strong weekend home potential.',
    shortDescription: '3600 sq.ft lake-view residential plot in Shankarpally.',
    price: 11200000,
    discountPrice: 10500000,
    stock: 3,
    unit: 'plot',
    location: loc('Hyderabad', 'Telangana', 'Shankarpally Lake Road', '501203'),
    attributes: attrs({ 'Plot Type': 'Residential', Area: '3600 sq.ft', Facing: 'North-East', 'Road Width': '40 ft', View: 'Lake View' }),
    imageKey: 'plotShankarpally',
    isFeatured: true,
  }),
  listing({
    name: '1 BHK Flat in Viman Nagar Pune',
    slug: '1bhk-flat-viman-nagar-pune',
    category: 'Flat',
    subcategory: '1 BHK',
    description: 'A compact 1 BHK flat in Viman Nagar with balcony, modular kitchen, covered parking, and easy access to Phoenix Marketcity and the airport.',
    shortDescription: 'Compact 1 BHK flat near airport and malls in Viman Nagar.',
    price: 6200000,
    discountPrice: 5900000,
    location: loc('Pune', 'Maharashtra', 'Viman Nagar', '411014'),
    attributes: attrs({ 'BHK Type': '1 BHK', Area: '560 sq.ft', Floor: '6th of 12', Parking: '1 Covered', Furnishing: 'Semi-Furnished' }),
    imageKey: 'flatViman',
  }),
  listing({
    name: '1 BHK Flat in Rajarhat Kolkata',
    slug: '1bhk-flat-rajarhat-kolkata',
    category: 'Flat',
    subcategory: '1 BHK',
    description: 'A value-focused 1 BHK flat in Rajarhat with open views, lift access, power backup, and a secure gated community.',
    shortDescription: 'Affordable 1 BHK flat in Rajarhat gated community.',
    price: 4200000,
    discountPrice: 3950000,
    location: loc('Kolkata', 'West Bengal', 'Rajarhat Main Road', '700135'),
    attributes: attrs({ 'BHK Type': '1 BHK', Area: '520 sq.ft', Floor: '5th of 10', Parking: '1 Open', Furnishing: 'Unfurnished' }),
    imageKey: 'flatRajarhat',
    isTrending: true,
  }),
  listing({
    name: '2 BHK Flat in Kharadi Pune',
    slug: '2bhk-flat-kharadi-pune',
    category: 'Flat',
    subcategory: '2 BHK',
    description: 'A modern 2 BHK flat in Kharadi near EON IT Park with a clubhouse, gym, children play area, and premium interiors.',
    shortDescription: 'Modern 2 BHK flat near EON IT Park in Kharadi.',
    price: 9800000,
    discountPrice: 9400000,
    location: loc('Pune', 'Maharashtra', 'Kharadi EON Free Zone', '411014'),
    attributes: attrs({ 'BHK Type': '2 BHK', Area: '1040 sq.ft', Floor: '9th of 16', Parking: '1 Covered', Furnishing: 'Semi-Furnished' }),
    imageKey: 'flatKharadi',
    isFeatured: true,
  }),
  listing({
    name: '2 BHK Flat in Madhapur Hyderabad',
    slug: '2bhk-flat-madhapur-hyderabad',
    category: 'Flat',
    subcategory: '2 BHK',
    description: 'A ready-to-move 2 BHK flat in Madhapur with strong rental demand, metro connectivity, two bathrooms, and a gated community.',
    shortDescription: 'Ready 2 BHK flat in Madhapur close to HITEC City.',
    price: 11800000,
    discountPrice: 11200000,
    location: loc('Hyderabad', 'Telangana', 'Madhapur HITEC City Road', '500081'),
    attributes: attrs({ 'BHK Type': '2 BHK', Area: '1180 sq.ft', Floor: '11th of 20', Parking: '1 Covered', Furnishing: 'Fully Furnished' }),
    imageKey: 'flatMadhapur',
    isTrending: true,
  }),
  listing({
    name: '3 BHK Flat in Vaishali Nagar Jaipur',
    slug: '3bhk-flat-vaishali-nagar-jaipur',
    category: 'Flat',
    subcategory: '3 BHK',
    description: 'A spacious 3 BHK flat in Vaishali Nagar with large balconies, family lounge, modular kitchen, and easy access to schools and hospitals.',
    shortDescription: 'Family-sized 3 BHK flat in Vaishali Nagar Jaipur.',
    price: 8600000,
    discountPrice: 8200000,
    location: loc('Jaipur', 'Rajasthan', 'Vaishali Nagar', '302021'),
    attributes: attrs({ 'BHK Type': '3 BHK', Area: '1520 sq.ft', Floor: '4th of 9', Parking: '2 Covered', Furnishing: 'Semi-Furnished' }),
    imageKey: 'flatJaipur',
    isFeatured: true,
  }),
  listing({
    name: '3 BHK Flat in Salt Lake Sector V Kolkata',
    slug: '3bhk-flat-salt-lake-sector-v-kolkata',
    category: 'Flat',
    subcategory: '3 BHK',
    description: 'A premium 3 BHK flat near Salt Lake Sector V with city views, work-from-home nook, clubhouse, pool, and fast access to offices.',
    shortDescription: 'Premium 3 BHK flat near Salt Lake Sector V offices.',
    price: 13200000,
    discountPrice: 12600000,
    location: loc('Kolkata', 'West Bengal', 'Salt Lake Sector V', '700091'),
    attributes: attrs({ 'BHK Type': '3 BHK', Area: '1650 sq.ft', Floor: '13th of 22', Parking: '2 Covered', Furnishing: 'Fully Furnished' }),
    imageKey: 'flatSaltLake',
    isTrending: true,
  }),
  listing({
    name: 'Furnished Studio in HSR Layout Bangalore',
    slug: 'furnished-studio-hsr-layout-bangalore',
    category: 'Studio',
    subcategory: 'Furnished Studio',
    description: 'A fully furnished studio apartment in HSR Layout with smart storage, kitchenette, workstation, high-speed internet, and access-controlled entry.',
    shortDescription: 'Fully furnished studio with workstation in HSR Layout.',
    price: 5200000,
    discountPrice: 4950000,
    location: loc('Bangalore', 'Karnataka', 'HSR Layout Sector 2', '560102'),
    attributes: attrs({ 'Property Type': 'Studio', Area: '430 sq.ft', Floor: '3rd of 8', Internet: 'Included', Furnishing: 'Fully Furnished' }),
    imageKey: 'studioHsr',
    isTrending: true,
  }),
  listing({
    name: 'Serviced Studio in Koregaon Park Pune',
    slug: 'serviced-studio-koregaon-park-pune',
    category: 'Studio',
    subcategory: 'Serviced Studio',
    description: 'A serviced studio in Koregaon Park with housekeeping support, compact kitchenette, balcony, gym access, and strong rental appeal.',
    shortDescription: 'Serviced studio with balcony in Koregaon Park.',
    price: 6800000,
    discountPrice: 6450000,
    location: loc('Pune', 'Maharashtra', 'Koregaon Park Lane 5', '411001'),
    attributes: attrs({ 'Property Type': 'Studio', Area: '500 sq.ft', Floor: '5th of 11', Services: 'Housekeeping', Furnishing: 'Fully Furnished' }),
    imageKey: 'studioKoregaon',
    isFeatured: true,
  }),
  listing({
    name: 'Commercial Showroom on SG Highway Ahmedabad',
    slug: 'commercial-showroom-sg-highway-ahmedabad',
    category: 'Commercial',
    subcategory: 'Showroom',
    description: 'A high-street commercial showroom on SG Highway with wide frontage, double-height ceiling, dedicated parking, and excellent brand visibility.',
    shortDescription: 'High-visibility showroom on SG Highway Ahmedabad.',
    price: 38500000,
    discountPrice: 36500000,
    location: loc('Ahmedabad', 'Gujarat', 'SG Highway', '380054'),
    attributes: attrs({ 'Property Type': 'Showroom', Area: '2100 sq.ft', Frontage: '42 ft', Parking: '6 Cars', Ceiling: 'Double Height' }),
    imageKey: 'commercialAhmedabad',
    isFeatured: true,
    isTrending: true,
  }),
  listing({
    name: 'Retail Commercial Space in Anna Nagar Chennai',
    slug: 'retail-commercial-space-anna-nagar-chennai',
    category: 'Commercial',
    subcategory: 'Retail Space',
    description: 'A ready retail commercial unit in Anna Nagar with main-road frontage, pantry, washroom, signage rights, and strong foot traffic.',
    shortDescription: 'Ready retail space with main-road frontage in Anna Nagar.',
    price: 24500000,
    discountPrice: 23200000,
    location: loc('Chennai', 'Tamil Nadu', 'Anna Nagar 2nd Avenue', '600040'),
    attributes: attrs({ 'Property Type': 'Retail Space', Area: '1350 sq.ft', Frontage: '28 ft', Parking: '3 Cars', Status: 'Ready to Move' }),
    imageKey: 'commercialChennai',
    isTrending: true,
  }),
  listing({
    name: 'Managed Office in BKC Mumbai',
    slug: 'managed-office-bkc-mumbai',
    category: 'Office',
    subcategory: 'Managed Office',
    description: 'A managed office suite in BKC with 36 seats, conference room, reception, pantry, enterprise internet, and premium business address.',
    shortDescription: '36-seat managed office suite in BKC Mumbai.',
    price: 54000000,
    discountPrice: 51500000,
    location: loc('Mumbai', 'Maharashtra', 'Bandra Kurla Complex', '400051'),
    attributes: attrs({ 'Property Type': 'Managed Office', Area: '2600 sq.ft', Seats: '36', Cabins: '3', Parking: '4 Slots' }),
    imageKey: 'officeMumbai',
    isFeatured: true,
  }),
  listing({
    name: 'Tech Office in Gachibowli Hyderabad',
    slug: 'tech-office-gachibowli-hyderabad',
    category: 'Office',
    subcategory: 'Tech Office',
    description: 'A plug-and-play tech office in Gachibowli with 48 seats, phone booths, two meeting rooms, server room, and metro-ready connectivity.',
    shortDescription: '48-seat plug-and-play tech office in Gachibowli.',
    price: 42000000,
    discountPrice: 39800000,
    location: loc('Hyderabad', 'Telangana', 'Gachibowli Financial District', '500032'),
    attributes: attrs({ 'Property Type': 'Tech Office', Area: '3200 sq.ft', Seats: '48', 'Meeting Rooms': '2', Parking: '6 Slots' }),
    imageKey: 'officeHyderabad',
    isTrending: true,
  }),
  listing({
    name: 'Sea View Penthouse in Worli Mumbai',
    slug: 'sea-view-penthouse-worli-mumbai',
    category: 'Penthouse',
    subcategory: '4 BHK Penthouse',
    description: 'A duplex sea-view penthouse in Worli with private terrace, plunge pool, smart lighting, four suites, and panoramic Arabian Sea views.',
    shortDescription: 'Duplex 4 BHK penthouse with private terrace in Worli.',
    price: 185000000,
    discountPrice: 176000000,
    stock: 1,
    location: loc('Mumbai', 'Maharashtra', 'Worli Sea Face', '400018'),
    attributes: attrs({ 'Property Type': 'Duplex Penthouse', BHK: '4 BHK', Area: '5200 sq.ft', Terrace: 'Private', Parking: '4 Covered' }),
    imageKey: 'penthouseMumbai',
    isFeatured: true,
    isTrending: true,
  }),
  listing({
    name: 'Golf Course Penthouse in Gurgaon',
    slug: 'golf-course-penthouse-gurgaon',
    category: 'Penthouse',
    subcategory: '5 BHK Penthouse',
    description: 'A luxury penthouse on Golf Course Road with a wraparound deck, home theatre, family lounge, private elevator access, and skyline views.',
    shortDescription: '5 BHK penthouse with deck and private elevator in Gurgaon.',
    price: 125000000,
    discountPrice: 119000000,
    stock: 1,
    location: loc('Gurgaon', 'Haryana', 'Golf Course Road', '122002'),
    attributes: attrs({ 'Property Type': 'Luxury Penthouse', BHK: '5 BHK', Area: '4800 sq.ft', Floor: 'Top Floor', Parking: '3 Reserved' }),
    imageKey: 'penthouseGurgaon',
    isFeatured: true,
  }),
  listing({
    name: '2 BHK Apartment in Hinjewadi Pune',
    slug: '2bhk-apartment-hinjewadi-pune-cloudinary',
    category: 'Apartments',
    subcategory: '2 BHK Apartment',
    description: 'A practical 2 BHK apartment in Hinjewadi Phase 1 with clubhouse, pool, landscaped court, covered parking, and IT park connectivity.',
    shortDescription: '2 BHK apartment near Hinjewadi IT Park with amenities.',
    price: 7600000,
    discountPrice: 7200000,
    location: loc('Pune', 'Maharashtra', 'Hinjewadi Phase 1', '411057'),
    attributes: attrs({ 'Property Type': 'Apartment', BHK: '2 BHK', Area: '980 sq.ft', Floor: '8th of 14', Amenities: 'Pool, Clubhouse, Garden' }),
    imageKey: 'apartmentPune',
    isTrending: true,
  }),
  listing({
    name: '3 BHK Apartment in Navalur Chennai',
    slug: '3bhk-apartment-navalur-chennai-cloudinary',
    category: 'Apartments',
    subcategory: '3 BHK Apartment',
    description: 'A family 3 BHK apartment on OMR Navalur with large balconies, clubhouse, gym, backup power, and quick access to tech parks.',
    shortDescription: 'Family 3 BHK apartment on OMR Navalur Chennai.',
    price: 10400000,
    discountPrice: 9900000,
    location: loc('Chennai', 'Tamil Nadu', 'OMR Navalur', '600130'),
    attributes: attrs({ 'Property Type': 'Apartment', BHK: '3 BHK', Area: '1480 sq.ft', Floor: '12th of 18', Amenities: 'Gym, Clubhouse, Power Backup' }),
    imageKey: 'apartmentChennai',
    isFeatured: true,
  }),
];

function assertCloudinaryConfig() {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Cloudinary environment variables: ${missing.join(', ')}`);
  }
}

async function uploadListingImage(item) {
  const source = IMAGE_SOURCES[item.imageKey];
  const publicId = `homeconnect/properties/seeded-more/${item.slug}`;
  const result = await cloudinary.uploader.upload(source, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
    transformation: [{ width: 1200, height: 900, crop: 'fill', quality: 'auto:good', fetch_format: 'auto' }],
  });

  return [{ url: result.secure_url, publicId: result.public_id }];
}

async function findOrCreateSeller() {
  let seller = await User.findOne({ role: { $in: ['admin', 'seller'] } });
  if (seller) return seller;

  seller = await User.create({
    name: 'HomeConnect Admin',
    email: 'admin@homeconnect.com',
    password: 'Admin@12345',
    role: 'admin',
    roles: ['admin'],
    isEmailVerified: true,
  });

  return seller;
}

async function seed() {
  assertCloudinaryConfig();
  await connectDB();

  const seller = await findOrCreateSeller();
  let created = 0;
  let updated = 0;

  for (const item of listings) {
    const images = await uploadListingImage(item);
    const { imageKey, ...doc } = item;

    const result = await Product.updateOne(
      { slug: doc.slug },
      { $set: { ...doc, images, seller: seller._id } },
      { upsert: true }
    );

    if (result.upsertedCount) created += 1;
    else if (result.modifiedCount || result.matchedCount) updated += 1;

    console.log(`Saved ${doc.category}: ${doc.name}`);
  }

  console.log(`\nDone. Created ${created}, updated ${updated}. Total Cloudinary listings processed: ${listings.length}.`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed error:', err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
