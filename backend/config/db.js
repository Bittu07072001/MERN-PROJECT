const dns = require('dns');
const mongoose = require('mongoose');

let connectionPromise = null;
let dnsConfigured = false;

const configureDnsForSrvRecords = () => {
  if (dnsConfigured || !process.env.MONGO_URI?.startsWith('mongodb+srv://')) return;

  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dnsConfigured = true;
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
    configureDnsForSrvRecords();

    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    const conn = await connectionPromise;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (err) {
    connectionPromise = null;
    console.error(`MongoDB error: ${err.message}`);
    throw err;
  }
};

module.exports = connectDB;
