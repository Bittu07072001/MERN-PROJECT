require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');

// Map of broken photo IDs → working replacements (all verified 200 OK)
const REPLACEMENTS = {
  'photo-1614596783969-e784059c1c21': 'photo-1613977257363-707ba9348227', // luxury condo interior
  'photo-1600607687644-c7171b42498b': 'photo-1600607688969-a5bfcd646154', // modern apartment room
  'photo-1600210491892-03d54079b5d4': 'photo-1600210492493-0946911123ea', // premium apartment interior
  'photo-1560185127-6a4a420fcf63':   'photo-1568605114967-8130f3a36994', // apartment exterior
};

function fixUrl(url) {
  for (const [broken, fixed] of Object.entries(REPLACEMENTS)) {
    if (url.includes(broken)) {
      return url.replace(broken, fixed);
    }
  }
  return url;
}

async function run() {
  await connectDB();

  const products = await Product.find({});
  let totalFixed = 0;

  for (const product of products) {
    let changed = false;
    const newImages = product.images.map(img => {
      const fixed = fixUrl(img.url);
      if (fixed !== img.url) {
        console.log(`  ✏️  [${product.category}] ${product.name.substring(0, 40)}`);
        console.log(`     OLD: ${img.url}`);
        console.log(`     NEW: ${fixed}`);
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

  if (totalFixed === 0) {
    console.log('✅ No broken images found — all good!');
  } else {
    console.log(`\n✅ Fixed ${totalFixed} broken image(s) across ${products.length} products.`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
