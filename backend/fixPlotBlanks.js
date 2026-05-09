require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');

// Only using photo IDs confirmed visible in the browser screenshots
const FIXES = {
  'commercial-plot-near-orr-bangalore': [
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format&q=80',
  ],
  'residential-plot-sarjapur-road-bangalore': [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&auto=format&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop&auto=format&q=80',
  ],
};

async function run() {
  await connectDB();
  for (const [slug, urls] of Object.entries(FIXES)) {
    const product = await Product.findOne({ slug });
    if (!product) { console.log('Not found: ' + slug); continue; }
    product.images = urls.map((url, i) => ({ url, publicId: `${slug}-img${i}` }));
    await product.save();
    console.log(`✅ Fixed: ${product.name}`);
  }
  process.exit(0);
}

run().catch(err => { console.error(err.message); process.exit(1); });
