const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/',           protect, ctrl.createOrder);
router.get('/my',          protect, ctrl.getMyOrders);
router.get('/:id',         protect, ctrl.getOrder);
router.put('/:id/cancel',  protect, ctrl.cancelOrder);
router.put('/:id/status',  protect, authorize('admin','seller'), ctrl.updateOrderStatus);

module.exports = router;
