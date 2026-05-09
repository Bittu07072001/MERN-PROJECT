require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');

// Ensure every Unsplash URL uses proper CDN params for browser rendering
function normalizeUrl(url) {
  if (!url || !url.includes('unsplash.com')) return url;
  // Strip existing query string and rebuild with canonical params
  const base = url.split('?')[0];
  return `${base}?w=800&h=600&fit=crop&auto=format&q=80`;
}

async function run() {
  await connectDB();
  const products = await Product.find({});
  let totalFixed = 0;

  for (const product of products) {
    let changed = false;
    const newImages = product.images.map(img => {
      const fixed = normalizeUrl(img.url);
      if (fixed !== img.url) {
        changed = true;
        totalFixed++;
        return { ...img.toObject(), url: fixed };
      }
      return img;
    });

    if (changed) {
      product.images = newImages;
      await product.save();
    }
  }

  console.log(`✅ Normalized ${totalFixed} image URLs across ${products.length} products.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
