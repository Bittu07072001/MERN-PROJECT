const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./models/Product');
const connectDB = require('./config/db');

// One curated YouTube property-tour video per BHK type
// (embed URLs — displayed in an iframe on the product detail page)
const videosByBHK = {
  '1 BHK': [
    {
      url: 'https://www.youtube.com/embed/c5VP3C0Kplg',
      title: '1 BHK Apartment Virtual Tour — Interior Walkthrough',
    },
    {
      url: 'https://www.youtube.com/embed/tUJDhBz2RHg',
      title: '1 BHK Flat — Full Room Tour & Layout',
    },
  ],
  '2 BHK': [
    {
      url: 'https://www.youtube.com/embed/YHIEnSl04kE',
      title: '2 BHK Apartment Virtual Tour — Spacious Layout',
    },
    {
      url: 'https://www.youtube.com/embed/4N1iwQxiHrs',
      title: '2 BHK Modern Flat Walkthrough',
    },
  ],
  '3 BHK': [
    {
      url: 'https://www.youtube.com/embed/IhJ5MpLDhGo',
      title: '3 BHK Premium Apartment Virtual Tour',
    },
    {
      url: 'https://www.youtube.com/embed/nSpxJ-8vJHc',
      title: '3 BHK Luxury Flat — Full Walkthrough',
    },
  ],
  '4 BHK': [
    {
      url: 'https://www.youtube.com/embed/Bg8ynSibH3g',
      title: '4 BHK Grand Apartment Virtual Tour',
    },
    {
      url: 'https://www.youtube.com/embed/CyvmBHEZ45A',
      title: '4 BHK Penthouse — Complete Walkthrough',
    },
  ],
};

async function seedVideos() {
  await connectDB();

  const flats = await Product.find({ category: 'Flat' });

  if (!flats.length) {
    console.log('No Flat listings found — run seedFlats.js first.');
    process.exit(1);
  }

  let updated = 0;
  for (const flat of flats) {
    const videos = videosByBHK[flat.subcategory];
    if (!videos) {
      console.warn(`  ⚠  No video mapping for subcategory: ${flat.subcategory}`);
      continue;
    }
    await Product.findByIdAndUpdate(flat._id, { $set: { videos } });
    console.log(`  ✅  [${flat.subcategory}] ${flat.name}`);
    updated++;
  }

  console.log(`\nDone — ${updated}/${flats.length} listings updated with videos.`);
  await mongoose.disconnect();
  process.exit(0);
}

seedVideos().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
