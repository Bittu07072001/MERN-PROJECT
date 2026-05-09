require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');

// Direct per-listing image overrides — keyed by slug
// Using verified 200-OK Unsplash IDs appropriate for each property type
const SLUG_OVERRIDES = {
  // PLOTS — replace wrong/unrelated photos with actual land/construction images
  'corner-residential-plot-gurgaon-sector-85': [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&h=600&fit=crop&auto=format&q=80',
  ],
  'residential-plot-sarjapur-road-bangalore': [
    'https://images.unsplash.com/photo-1503525148566-ef5c2b9c93bd?w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=800&h=600&fit=crop&auto=format&q=80',
  ],
  'commercial-plot-near-orr-bangalore': [
    'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1589923188651-268a9765e432?w=800&h=600&fit=crop&auto=format&q=80',
  ],
  'farm-land-na-plot-alibaug-maharashtra': [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop&auto=format&q=80',
  ],
  // VILLA — fix Lonavala blank image
  'luxury-4bhk-villa-lonavala-maharashtra': [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&auto=format&q=80',
  ],
  // OFFICES — replace city skyline used in office & duplicate images
  'corporate-office-floor-dlf-cyberhub-gurgaon': [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop&auto=format&q=80',
  ],
};

async function run() {
  await connectDB();
  const products = await Product.find({});
  let totalFixed = 0;

  for (const product of products) {
    const override = SLUG_OVERRIDES[product.slug];
    if (!override) continue;

    console.log(`  ✏️  [${product.category}] ${product.name}`);
    product.images = override.map((url, i) => ({
      url,
      publicId: `${product.slug}-img${i}`,
    }));
    await product.save();
    totalFixed++;
  }

  if (totalFixed === 0) {
    console.log('No listings needed image overrides.');
  } else {
    console.log(`\n✅ Updated images for ${totalFixed} listing(s).`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
