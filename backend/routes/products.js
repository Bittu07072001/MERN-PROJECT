const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/productController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const { uploadVideo } = require('../middleware/upload');

router.get('/',            optionalAuth, ctrl.getProducts);
router.get('/categories',  ctrl.getCategories);
// Upload routes MUST come before /:id to avoid being matched as an id param
router.post('/upload-images', protect, authorize('seller','admin'), upload.array('images', 5), ctrl.uploadImages);
router.post('/upload-video',  protect, authorize('seller','admin'), uploadVideo.single('video'), ctrl.uploadVideo);
router.get('/:id',         optionalAuth, ctrl.getProduct);
router.post('/',           protect, authorize('seller','admin'), ctrl.createProduct);
router.put('/:id',         protect, authorize('seller','admin'), ctrl.updateProduct);
router.delete('/:id',      protect, authorize('seller','admin'), ctrl.deleteProduct);

module.exports = router;
