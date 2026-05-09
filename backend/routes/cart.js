const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/',                    protect, ctrl.getCart);
router.post('/add',                protect, ctrl.addToCart);
router.put('/item/:productId',     protect, ctrl.updateCartItem);
router.delete('/item/:productId',  protect, ctrl.removeFromCart);
router.delete('/clear',            protect, ctrl.clearCart);

module.exports = router;
