const nodemailer = require('nodemailer');

const env = (key, fallback = '') => (process.env[key] || fallback).trim();

const transporter = nodemailer.createTransport({
  host:   env('SMTP_HOST', 'smtp.gmail.com'),
  port:   Number(env('SMTP_PORT', '587')) || 587,
  secure: env('SMTP_PORT', '587') === '465',
  auth: {
    user: env('SMTP_USER'),
    pass: env('SMTP_PASS'),
  },
});

exports.generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const subjects = {
  register: '🔐 Verify Your HomeConnect Account',
  login:    '🔑 Your HomeConnect Login OTP',
  reset:    '🔒 HomeConnect Password Reset OTP',
};

const bodies = {
  register: (otp) => `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">🏠 HomeConnect</h1>
        <p style="color:#e0e7ff;margin:8px 0 0">Verify Your Account</p>
      </div>
      <div style="padding:32px">
        <p style="color:#374151;font-size:16px">Your registration OTP is:</p>
        <div style="background:#ede9fe;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
          <span style="font-size:36px;font-weight:700;color:#6366f1;letter-spacing:8px">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:14px">This OTP expires in <b>10 minutes</b>. Do not share it with anyone.</p>
      </div>
    </div>`,
  login: (otp) => `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">🏠 HomeConnect</h1>
        <p style="color:#e0e7ff;margin:8px 0 0">Login OTP</p>
      </div>
      <div style="padding:32px">
        <p style="color:#374151;font-size:16px">Your login OTP is:</p>
        <div style="background:#ede9fe;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
          <span style="font-size:36px;font-weight:700;color:#6366f1;letter-spacing:8px">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:14px">Expires in <b>10 minutes</b>. If you didn't request this, please ignore.</p>
      </div>
    </div>`,
  reset: (otp) => `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#ef4444,#f97316);padding:32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">🏠 HomeConnect</h1>
        <p style="color:#fee2e2;margin:8px 0 0">Password Reset</p>
      </div>
      <div style="padding:32px">
        <p style="color:#374151;font-size:16px">Your password reset OTP is:</p>
        <div style="background:#fee2e2;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
          <span style="font-size:36px;font-weight:700;color:#ef4444;letter-spacing:8px">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:14px">Expires in <b>10 minutes</b>. If you didn't request this, secure your account immediately.</p>
      </div>
    </div>`,
};

exports.sendOTPEmail = async (email, otp, type = 'login') => {
  try {
    await transporter.sendMail({
      from:    `"${env('FROM_NAME', 'HomeConnect')}" <${env('FROM_EMAIL', env('SMTP_USER'))}>`,
      to:      email,
      subject: subjects[type] || subjects.login,
      html:    bodies[type]?.(otp) || bodies.login(otp),
    });
    console.log(`✉️  OTP email sent to ${email}`);
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    // Don't throw – log OTP for dev
    console.log(`🔑 FALLBACK OTP for ${email}: ${otp}`);
    if (process.env.NODE_ENV === 'production') throw err;
  }
};

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatMoney = (value = 0) => money.format(Math.max(0, Number(value) || 0));

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(value instanceof Date ? value : new Date(value));

exports.sendEmiPaymentEmail = async (email, details) => {
  try {
    const {
      buyerName = 'Buyer',
      orderNumber,
      paidAmount,
      paidAt,
      paymentId,
      nextEmiAmount,
      nextEmiDate,
      remainingAmount,
      tenureMonths,
      annualRate,
    } = details;

    await transporter.sendMail({
      from: `"${env('FROM_NAME', 'HomeConnect')}" <${env('FROM_EMAIL', env('SMTP_USER'))}>`,
      to: email,
      subject: `HomeConnect EMI payment update for ${orderNumber}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#f9fafb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="background:#4f46e5;padding:28px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">HomeConnect</h1>
            <p style="color:#e0e7ff;margin:8px 0 0">EMI payment confirmation</p>
          </div>
          <div style="padding:28px;color:#374151">
            <p style="font-size:16px;margin-top:0">Hi ${buyerName},</p>
            <p>Your EMI payment for order <b>${orderNumber}</b> has been recorded successfully.</p>

            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:18px 0">
              <h2 style="font-size:16px;margin:0 0 12px;color:#111827">Recently paid EMI</h2>
              <p style="margin:6px 0"><b>Paid amount:</b> ${formatMoney(paidAmount)}</p>
              <p style="margin:6px 0"><b>Paid date:</b> ${formatDate(paidAt)}</p>
              <p style="margin:6px 0"><b>Payment ID:</b> ${paymentId}</p>
            </div>

            <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px;margin:18px 0">
              <h2 style="font-size:16px;margin:0 0 12px;color:#312e81">Next EMI details</h2>
              <p style="margin:6px 0"><b>Next EMI amount:</b> ${formatMoney(nextEmiAmount)}</p>
              <p style="margin:6px 0"><b>Due date:</b> ${formatDate(nextEmiDate)}</p>
              <p style="margin:6px 0"><b>Remaining amount:</b> ${formatMoney(remainingAmount)}</p>
            </div>

            <p style="font-size:13px;color:#6b7280">
              EMI values are estimated using ${annualRate}% p.a. for ${tenureMonths} months.
              Final bank/card EMI charges may vary as per the payment provider.
            </p>
          </div>
        </div>`,
    });
    console.log(`EMI payment email sent to ${email}`);
  } catch (err) {
    console.error('EMI payment email failed:', err.message);
  }
};
