const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',                ctrl.register);
router.post('/verify-registration-otp', ctrl.verifyRegistrationOTP);
router.post('/login',                   ctrl.login);
router.post('/google',                  ctrl.googleAuth);
router.post('/verify-login-otp',        ctrl.verifyLoginOTP);
router.post('/select-role',             ctrl.selectRole);
router.post('/resend-otp',              ctrl.resendOTP);
router.post('/refresh-token',           ctrl.refreshToken);
router.post('/forgot-password',         ctrl.forgotPassword);
router.post('/verify-reset-otp',        ctrl.verifyResetOTP);
router.post('/reset-password/:token',   ctrl.resetPassword);
router.get('/me',        protect, ctrl.getMe);
router.post('/logout',   protect, ctrl.logout);
router.get('/setup-2fa', protect, ctrl.setup2FA);
router.post('/enable-2fa',  protect, ctrl.enable2FA);
router.post('/disable-2fa', protect, ctrl.disable2FA);

module.exports = router;
