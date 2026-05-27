const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/live-counts',                        ctrl.getLiveCounts);
router.get('/dashboard',                          ctrl.getDashboard);
router.get('/overview',                           ctrl.getOverviewStats);

router.get('/users',                              ctrl.getUsers);
router.put('/users/:userId/toggle',               ctrl.toggleUserStatus);
router.delete('/users/:userId',                   ctrl.deleteUser);

router.get('/sellers',                            ctrl.getSellers);
router.post('/sellers',                           ctrl.addSeller);
router.put('/sellers/:sellerId',                  ctrl.updateSeller);
router.delete('/sellers/:sellerId',               ctrl.removeSeller);

router.get('/products',                           ctrl.getAllProducts);
router.put('/products/:id',                       ctrl.adminUpdateProperty);
router.delete('/products/:id',                    ctrl.adminDeleteProperty);
router.put('/products/:id/approve',               ctrl.approveProperty);
router.put('/products/:id/reject',                ctrl.rejectProperty);

router.get('/orders',                             ctrl.getAllOrders);

router.post('/coupons',                           ctrl.createCoupon);
router.get('/coupons',                            ctrl.getCoupons);
router.put('/coupons/:id',                        ctrl.updateCoupon);
router.delete('/coupons/:id',                     ctrl.deleteCoupon);

router.post('/broadcast',                         ctrl.broadcastNotification);
router.get('/ai-logs',                            ctrl.getAILogs);

module.exports = router;
