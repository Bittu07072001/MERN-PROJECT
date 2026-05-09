const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { socketHandler } = require('./utils/socket');

dotenv.config();
connectDB();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL].filter(Boolean)
  : true;

// Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);
socketHandler(io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (images/videos) statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiter
const rateLimit = require('express-rate-limit');
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/wishlist',      require('./routes/wishlist'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/coupons',       require('./routes/coupons'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/seller',        require('./routes/seller'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/analytics',     require('./routes/analytics'));

app.get('/api/health', (_, res) => res.json({ status: 'OK', message: 'HomeConnect API Running 🚀' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Handle unhandled promise rejections and uncaught exceptions gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, io };
