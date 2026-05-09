const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose 7+ no longer requires useNewUrlParser / useUnifiedTopology options,
    // but serverSelectionTimeoutMS prevents hanging forever on bad URIs.
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
