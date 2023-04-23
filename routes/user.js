var express = require('express');
var router = express.Router();
const usercontrollers = require('../controllers/userControllers')


/* GET home page. */
router.get('/',usercontrollers.getHome);

router.get('/login',usercontrollers.getLogin);

router.post('/login',usercontrollers.postLogin);

router.get('/logout',usercontrollers.getLogout);

router.get('/user-signup',usercontrollers.getSignUp);

router.post('/user-signup',usercontrollers.postSignUp);

router.get('/product-lists',usercontrollers.getProducts);

router .get('/otp-Login',usercontrollers.getOtpLogin)

router.post('/otp-login',usercontrollers.postOtpLogin)

router.get('/verify-otp',usercontrollers.getVerifyOtp)

router.post('/verify-otp',usercontrollers.postVerifyOtp)

router.get('/cart',usercontrollers.getCart)

router.get('/add-to-cart',usercontrollers.getaddToCart)

router.post('/change-product-quantity',usercontrollers.postProQuantity)

router.get('/place-order',usercontrollers.getPlaceOrder)

router.get('/order-success',usercontrollers.getOrderSuccess)

router.post('/place-order',usercontrollers.postPlaceOrder)

router.get('/orders',usercontrollers.getOrders)

router.post('/change-status-order',usercontrollers.postOrderStatus)

router.get('/view-Order-products',usercontrollers.getViewOrders)

router.get('/product-lists',usercontrollers.getAllProducts)

router.get('/product-list',usercontrollers.getProductList)

router.get('/address',usercontrollers.getAddress)

router.post('/address',usercontrollers.postAddress)

module.exports = router;
