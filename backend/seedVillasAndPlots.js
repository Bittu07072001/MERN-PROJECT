const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Product = require('./models/Product');
const connectDB = require('./config/db');

const villas = [
  {
    name: 'Luxury 4 BHK Villa in Lonavala, Maharashtra',
    slug: 'luxury-4bhk-villa-lonavala-maharashtra',
    description: 'A magnificent 4 BHK standalone villa nestled in the scenic hills of Lonavala. Spanning 5000 sq.ft of living space on a 10,000 sq.ft plot, this villa features a private swimming pool, landscaped garden, home theatre, chef\'s kitchen, and four en-suite bedrooms. Enjoy breathtaking valley views from every room. The property is gated with 24/7 security, covered parking for 4 cars, and a separate servant\'s quarter.',
    shortDescription: 'Lavish 4 BHK hilltop villa with private pool and valley views in Lonavala.',
    price: 85000000,
    discountPrice: 80000000,
    category: 'Villa',
    subcategory: '4 BHK Villa',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800', publicId: 'villa-lon-1' },
      { url: 'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800', publicId: 'villa-lon-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/CyvmBHEZ45A', title: '4 BHK Luxury Villa Walkthrough — Lonavala' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Standalone Villa' },
      { key: 'BHK', value: '4 BHK' },
      { key: 'Built-up Area', value: '5000 sq.ft' },
      { key: 'Plot Area', value: '10,000 sq.ft' },
      { key: 'Floors', value: 'G+1' },
      { key: 'Parking', value: '4 Covered' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Amenities', value: 'Private Pool, Garden, Home Theatre' },
      { key: 'Location', value: 'Lonavala, Maharashtra' },
    ],
    tags: ['villa', '4bhk', 'luxury', 'pool', 'lonavala', 'hills', 'residential'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 90 },
  },
  {
    name: '3 BHK Villa in Whitefield, Bangalore',
    slug: '3bhk-villa-whitefield-bangalore',
    description: 'Beautiful 3 BHK independent villa in the prestigious Whitefield locality of Bangalore. The property sits on a 4000 sq.ft plot with a lush garden and features three spacious bedrooms, two living areas, a modular kitchen, and a private parking porch. The villa is located in a gated villa community with a clubhouse, jogging track, and children\'s play area. Close to ITPL and major tech parks.',
    shortDescription: 'Elegant 3 BHK independent villa in gated community, Whitefield Bangalore.',
    price: 28000000,
    discountPrice: 26500000,
    category: 'Villa',
    subcategory: '3 BHK Villa',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', publicId: 'villa-wf-1' },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', publicId: 'villa-wf-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/IhJ5MpLDhGo', title: '3 BHK Villa Tour — Whitefield Bangalore' },
    ],
    stock: 2,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Independent Villa' },
      { key: 'BHK', value: '3 BHK' },
      { key: 'Built-up Area', value: '2800 sq.ft' },
      { key: 'Plot Area', value: '4000 sq.ft' },
      { key: 'Floors', value: 'G+1' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Semi-Furnished' },
      { key: 'Amenities', value: 'Garden, Clubhouse, Jogging Track' },
      { key: 'Location', value: 'Whitefield, Bangalore' },
    ],
    tags: ['villa', '3bhk', 'independent', 'whitefield', 'bangalore', 'gated community'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 60 },
  },
  {
    name: '5 BHK Ultra-Luxury Villa in DLF Chhattarpur, Delhi',
    slug: '5bhk-ultra-luxury-villa-dlf-chhattarpur-delhi',
    description: 'An extraordinary 5 BHK ultra-luxury villa in the exclusive DLF Chhattarpur enclave, South Delhi. This architectural masterpiece spans 8000 sq.ft across three floors with a rooftop deck, temperature-controlled wine cellar, a state-of-the-art home automation system, infinity pool, spa, and a 3-car underground garage. The villa also features a guest suite, staff quarters, and a stunning wrap-around landscaped garden.',
    shortDescription: 'Ultra-luxury 5 BHK villa with infinity pool and smart home in South Delhi.',
    price: 250000000,
    discountPrice: 240000000,
    category: 'Villa',
    subcategory: '5 BHK Villa',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', publicId: 'villa-dlf-1' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', publicId: 'villa-dlf-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/Bg8ynSibH3g', title: 'Ultra-Luxury 5 BHK Villa Tour — DLF Delhi' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Ultra-Luxury Villa' },
      { key: 'BHK', value: '5 BHK' },
      { key: 'Built-up Area', value: '8000 sq.ft' },
      { key: 'Plot Area', value: '12,000 sq.ft' },
      { key: 'Floors', value: 'G+2 + Rooftop' },
      { key: 'Parking', value: '3 Underground' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Amenities', value: 'Infinity Pool, Spa, Wine Cellar, Smart Home' },
      { key: 'Location', value: 'DLF Chhattarpur, South Delhi' },
    ],
    tags: ['villa', '5bhk', 'ultra-luxury', 'delhi', 'dlf', 'smart home', 'pool'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 120 },
  },
  {
    name: '4 BHK Villa in ECR, Chennai',
    slug: '4bhk-villa-ecr-chennai',
    description: 'Stunning beachside 4 BHK villa on the East Coast Road (ECR), Chennai, with direct beach access. The property features four large bedrooms, a spacious living area, a rooftop terrace with sea views, a tropical garden, and a private splash pool. The villa is equipped with solar panels, a rainwater harvesting system, and is located in a gated beachside villa community with round-the-clock security.',
    shortDescription: 'Beachside 4 BHK villa with direct sea access and rooftop terrace on ECR Chennai.',
    price: 45000000,
    discountPrice: 42000000,
    category: 'Villa',
    subcategory: '4 BHK Villa',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800', publicId: 'villa-ecr-1' },
      { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', publicId: 'villa-ecr-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/CyvmBHEZ45A', title: 'Beachside 4 BHK Villa Tour — ECR Chennai' },
    ],
    stock: 1,
    unit: 'unit',
    attributes: [
      { key: 'Property Type', value: 'Beachside Villa' },
      { key: 'BHK', value: '4 BHK' },
      { key: 'Built-up Area', value: '4500 sq.ft' },
      { key: 'Plot Area', value: '7000 sq.ft' },
      { key: 'Floors', value: 'G+1 + Rooftop' },
      { key: 'Parking', value: '2 Covered' },
      { key: 'Furnishing', value: 'Fully Furnished' },
      { key: 'Amenities', value: 'Beach Access, Splash Pool, Solar Panels' },
      { key: 'Location', value: 'ECR, Chennai' },
    ],
    tags: ['villa', '4bhk', 'beach', 'ecr', 'chennai', 'sea view', 'luxury'],
    isFeatured: false,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 90 },
  },
];

const plots = [
  {
    name: 'Residential Plot in Sarjapur Road, Bangalore',
    slug: 'residential-plot-sarjapur-road-bangalore',
    description: 'A premium residential plot of 2400 sq.ft in the high-demand Sarjapur Road corridor of Bangalore. The plot is part of a BMRDA-approved layout with all infrastructure in place — roads, drainage, electricity, and water supply. Ideal for building your dream home. Surrounded by reputed schools, hospitals, IT parks, and shopping malls. Clear title deeds, zero encumbrance.',
    shortDescription: 'BMRDA-approved 2400 sq.ft residential plot in Sarjapur Road, Bangalore.',
    price: 9600000,
    discountPrice: 9000000,
    category: 'Plot',
    subcategory: 'Residential Plot',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', publicId: 'plot-sar-1' },
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', publicId: 'plot-sar-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/tUJDhBz2RHg', title: 'Residential Plot Walkthrough — Sarjapur Road Bangalore' },
    ],
    stock: 5,
    unit: 'plot',
    attributes: [
      { key: 'Plot Type', value: 'Residential' },
      { key: 'Area', value: '2400 sq.ft (30×80)' },
      { key: 'Layout Approval', value: 'BMRDA Approved' },
      { key: 'Road Width', value: '30 ft' },
      { key: 'Corner Plot', value: 'No' },
      { key: 'Facing', value: 'East' },
      { key: 'Water Supply', value: 'Borewell + BWSSB' },
      { key: 'Location', value: 'Sarjapur Road, Bangalore' },
    ],
    tags: ['plot', 'residential', 'land', 'sarjapur', 'bangalore', 'bmrda', 'investment'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: 'Corner Residential Plot in Gurgaon Sector 85',
    slug: 'corner-residential-plot-gurgaon-sector-85',
    description: 'Premium east-facing corner residential plot of 3000 sq.ft in the rapidly developing Sector 85, Gurgaon. Located in an HRERA-approved plotted development with wide internal roads (40 ft), underground utilities, street lighting, and 24/7 security. Close to the upcoming metro extension, expressway, and international schools. A high-appreciation investment in New Gurgaon.',
    shortDescription: 'East-facing 3000 sq.ft corner plot in HRERA-approved layout, Gurgaon Sector 85.',
    price: 15000000,
    discountPrice: 14200000,
    category: 'Plot',
    subcategory: 'Residential Plot',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800', publicId: 'plot-grg-1' },
      { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', publicId: 'plot-grg-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/4N1iwQxiHrs', title: 'Corner Plot Walkthrough — Gurgaon Sector 85' },
    ],
    stock: 3,
    unit: 'plot',
    attributes: [
      { key: 'Plot Type', value: 'Residential Corner' },
      { key: 'Area', value: '3000 sq.ft (40×75)' },
      { key: 'Layout Approval', value: 'HRERA Approved' },
      { key: 'Road Width', value: '40 ft' },
      { key: 'Corner Plot', value: 'Yes' },
      { key: 'Facing', value: 'East' },
      { key: 'Water Supply', value: 'MCG Pipeline' },
      { key: 'Location', value: 'Sector 85, Gurgaon' },
    ],
    tags: ['plot', 'corner', 'residential', 'land', 'gurgaon', 'hrera', 'new gurgaon', 'investment'],
    isFeatured: true,
    isTrending: false,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: 'Commercial Plot Near ORR, Bangalore',
    slug: 'commercial-plot-near-orr-bangalore',
    description: 'High-visibility commercial plot of 5000 sq.ft with a 60 ft road frontage situated on the Outer Ring Road (ORR), Bangalore — one of the city\'s busiest commercial arteries. The plot has BDA approval for commercial construction up to G+4 floors. Ideal for building a commercial complex, showroom, or mixed-use development. Surrounded by major IT companies, hotels, and retail outlets.',
    shortDescription: 'BDA-approved 5000 sq.ft commercial plot with 60 ft frontage on ORR Bangalore.',
    price: 32000000,
    discountPrice: 30500000,
    category: 'Plot',
    subcategory: 'Commercial Plot',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800', publicId: 'plot-orr-1' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', publicId: 'plot-orr-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/YHIEnSl04kE', title: 'Commercial Plot Walkthrough — ORR Bangalore' },
    ],
    stock: 1,
    unit: 'plot',
    attributes: [
      { key: 'Plot Type', value: 'Commercial' },
      { key: 'Area', value: '5000 sq.ft' },
      { key: 'Road Frontage', value: '60 ft (ORR)' },
      { key: 'Layout Approval', value: 'BDA Approved' },
      { key: 'Permissible FAR', value: 'G+4 Floors' },
      { key: 'Facing', value: 'North-East' },
      { key: 'Zoning', value: 'Commercial' },
      { key: 'Location', value: 'Outer Ring Road, Bangalore' },
    ],
    tags: ['plot', 'commercial', 'land', 'orr', 'bangalore', 'bda', 'investment', 'high street'],
    isFeatured: true,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
  },
  {
    name: 'Farm Land / NA Plot in Alibaug, Maharashtra',
    slug: 'farm-land-na-plot-alibaug-maharashtra',
    description: 'A stunning 1-acre (43,560 sq.ft) NA (Non-Agricultural) converted plot in the serene coastal town of Alibaug, just 45 minutes from Mumbai by ferry. The land has a valid NA order, clear title, and road access. Ideal for building a farmhouse, resort, or weekend getaway. The property is surrounded by lush greenery, mango orchards, and is a short drive to Alibaug\'s famous beaches.',
    shortDescription: 'NA-converted 1-acre farmland near the beach — ideal for farmhouse/resort in Alibaug.',
    price: 25000000,
    discountPrice: 23000000,
    category: 'Plot',
    subcategory: 'Farm / NA Plot',
    brand: 'HomeConnect Realty',
    images: [
      { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800', publicId: 'plot-ali-1' },
      { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', publicId: 'plot-ali-2' },
    ],
    videos: [
      { url: 'https://www.youtube.com/embed/c5VP3C0Kplg', title: 'Farm Land / NA Plot Tour — Alibaug Maharashtra' },
    ],
    stock: 1,
    unit: 'plot',
    attributes: [
      { key: 'Plot Type', value: 'NA Converted Farm Land' },
      { key: 'Area', value: '1 Acre (43,560 sq.ft)' },
      { key: 'NA Order', value: 'Valid' },
      { key: 'Road Access', value: '20 ft Mud Road' },
      { key: 'Distance to Beach', value: '2 km' },
      { key: 'Distance to Mumbai Ferry', value: '8 km' },
      { key: 'Surrounding', value: 'Mango Orchards & Greenery' },
      { key: 'Location', value: 'Alibaug, Maharashtra' },
    ],
    tags: ['plot', 'farm', 'na', 'alibaug', 'maharashtra', 'farmhouse', 'resort', 'beach', 'investment'],
    isFeatured: false,
    isTrending: true,
    shippingInfo: { freeShipping: false, shippingCost: 0, deliveryDays: 30 },
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

  // Clear existing
  const delV = await Product.deleteMany({ category: 'Villa' });
  const delP = await Product.deleteMany({ category: 'Plot' });
  console.log(`Cleared ${delV.deletedCount} Villa + ${delP.deletedCount} Plot listings.`);

  const allDocs = [...villas, ...plots].map(d => ({ ...d, seller: seller._id }));
  const inserted = await Product.insertMany(allDocs);
  console.log(`\n✅ Inserted ${inserted.length} listings:\n`);
  inserted.forEach(p => console.log(`  • [${p.category} — ${p.subcategory}] ${p.name} — ₹${p.price.toLocaleString('en-IN')}`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
