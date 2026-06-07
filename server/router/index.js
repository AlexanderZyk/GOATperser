const Router = require('express').Router;
const userController = require('../controllers/user-controller');
const parserController = require('../controllers/parser-controller');
const cartController = require('../controllers/cart-controller');
const orderController = require('../controllers/order-controller');
const adminController = require('../controllers/admin-controller');
const router = new Router();
const {body} = require('express-validator');
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');

router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({min: 3, max: 32}),
    userController.registration
);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/refresh', userController.refresh);
router.get('/users', authMiddleware, userController.getUsers);
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/password', authMiddleware, userController.changePassword);

router.post('/parse', parserController.parse);

router.get('/cart', authMiddleware, cartController.getCart);
router.post('/cart', authMiddleware, cartController.addToCart);
router.delete('/cart/:id', authMiddleware, cartController.removeFromCart);
router.delete('/cart', authMiddleware, cartController.clearCart);


router.post('/orders', authMiddleware, orderController.createOrder);
router.get('/orders', authMiddleware, orderController.getOrders);

router.get('/admin/orders', adminMiddleware, adminController.getAllOrders);
router.patch('/admin/orders/:id/status', adminMiddleware, adminController.updateOrderStatus);

module.exports = router;
