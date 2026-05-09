# 🏠 HomeConnect — MERN Real Estate Platform

A full-featured MERN stack real estate marketplace with multi-role auth (buyer/seller/admin), OTP login, real-time chat, AI property recommendations, and Razorpay payments.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account (for OTP emails) or any SMTP provider

### One-step install (from project root)
```bash
npm run install:all
```

### Backend Setup
```bash
cd backend
cp .env.example .env      # fill in your values
npm install
npm run dev               # starts on port 8000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env      # fill in your values
npm install
npm run dev               # starts on port 5000
```

### Run both at once (from project root)
```bash
npm run dev
```

## 👥 Roles
| Role | Access |
|------|--------|
| **Customer/Buyer** | Browse properties, book visits, chat with sellers, cart & checkout |
| **Seller** | List properties, manage inventory, view orders |
| **Admin** | Full platform control — approve listings, manage users, view analytics |

## ✨ Features
- 🔐 OTP email login + 2FA support
- 🏘️ Multi-role accounts (one email → buyer + seller)
- 🤖 AI property chat (Groq/LLaMA), recommendations & comparisons
- 📅 Property visit booking system
- 💬 Real-time buyer–seller chat (Socket.io)
- 🛒 Cart, wishlist, checkout with Razorpay
- 📊 Admin dashboard with live stats
- 🌙 Dark mode

## 🔑 Key Notes
- **OTP fallback**: If SMTP is not configured, OTPs are printed in the server console (dev mode)
- **Image uploads**: Uses local `backend/uploads/` folder by default (Cloudinary optional)
- **Listings**: New seller listings are auto-approved and go live immediately; admins can reject from the admin panel

## 🛠 v2.2.0 — Bug Fixes & Upgrades

### Bug Fixes
- **`package.json`** — Fixed non-existent package versions: `nodemailer` corrected from `^8.0.7` → `^6.9.7`; `uuid` from `^14.0.0` → `^9.0.0`
- **`frontend/package.json`** — Upgraded `@vitejs/plugin-react` from `^4.7.0` → `^5.0.0` to match Vite 7 peer dependency requirements
- **`vite.config.js`** — Changed `allowedHosts: true` (deprecated boolean) → `'all'` (Vite 6+ syntax); added `/uploads` proxy entry so images load correctly in dev; added explicit `build.outDir`
- **`productController.js`** — Fixed price range filter: previously used `$or` which silently overwrote other query conditions; now uses `$and` to safely compose with existing filters
- **`productController.js`** — Fixed seller product preview: sellers can now properly preview their own pending/rejected products via the detail page without an extra DB query
- **`Product.js` model** — Fixed slug uniqueness: slugs now include a random 5-char suffix to prevent `E11000 duplicate key` errors when two products share the same name
- **`User.js` model** — Removed `sparse: true` from field definition (invalid on the field itself); sparse behaviour is achieved via the schema index, preventing silent MongoDB index errors
- **`App.jsx`** — Added `eslint-disable` comment to `useEffect` missing-dependency warning to prevent React strict-mode double-init issues

## 🛠 v2.2.0 — Deep Audit Bug Fixes

### Critical Fixes
- **`ProductForm.jsx`** (image upload) — **Most impactful fix**: Images were stored as browser `blob:` URLs and submitted directly to the server, which can't use them. Now pending image files are tracked in memory and automatically uploaded to `/products/upload-images` on form submit before the listing is created/updated. This means seller property images now actually save correctly.
- **`reviewController.js`** (`deleteReview`) — When an admin deleted a review they didn't own, `review` was `null` → `review.product` crashed with `Cannot read properties of null`. Now fetches the review by ID first, then checks ownership — no crash for admin or user delete.
- **`routes/coupons.js`** — `GET /`, `PUT /:id`, `DELETE /:id` handlers had no `try/catch`, causing uncaught promise rejections on any DB error. All handlers now have proper error handling. Also added `runValidators: true` to PUT and a 404 guard to DELETE.

### Backend Improvements
- **`server.js`** — Added `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers to prevent silent crashes from unhandled async errors.
- **`config/db.js`** — Added `serverSelectionTimeoutMS: 5000` to MongoDB connection so the server fails fast with a clear error instead of hanging on bad URI/network.
- **`controllers/adminController.js`** — Moved `require('../models/Booking')` to top-level imports (was repeated inline inside `getLiveCounts` and `getOverviewStats`), preventing redundant module resolution on every request.

### Frontend Improvements
- **`CustomerLayout.jsx`** — Socket.io now uses `user?._id` as the effect dependency (was `user` object) to prevent reconnection on unrelated user-object mutations; added `socket.off()` before `disconnect()` to remove all listeners and prevent memory leaks.
- **`AdminLayout.jsx`** — Same socket cleanup fix: `socket.off()` added before disconnect.
- **`ProductForm.jsx`** — Submit button is now disabled and shows "Uploading images…" while the image upload is in progress, preventing double-submit.
- **`ProductDetail.jsx`, `EditProduct.jsx`, `Checkout.jsx`, `CustomerLayout.jsx`** — Added `eslint-disable-next-line react-hooks/exhaustive-deps` comments to `useEffect` hooks with intentionally stable dependency arrays, silencing false positive warnings.
