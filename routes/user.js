var express = require('express');
var router = express.Router();
const usercontrollers = require('../controllers/userControllers')
let {userSession,loginSession}=require('../middleware/session')
router.use(usercontrollers.middleware)
/* GET home page. */
router.get('/',usercontrollers.getHome);

router.get('/login',loginSession,usercontrollers.getLogin);

router.post('/login',usercontrollers.postLogin);

router.get('/logout',usercontrollers.getLogout);

router.get('/user-signup',loginSession,usercontrollers.getSignUp);

router.post('/user-signup',usercontrollers.postSignUp);

router.get('/product-lists',usercontrollers.getProducts);

router.get('/otp-Login',loginSession,usercontrollers.getOtpLogin)

router.post('/otp-login',loginSession,usercontrollers.postOtpLogin)

router.get('/verify-otp',loginSession,usercontrollers.getVerifyOtp)

router.post('/verify-otp',loginSession,usercontrollers.postVerifyOtp)

router.get('/cart',userSession,usercontrollers.getCart)

router.get('/add-to-cart',userSession,usercontrollers.getaddToCart)

router.post('/change-product-quantity',usercontrollers.postProQuantity)

router.get('/place-order',userSession,usercontrollers.getPlaceOrder)

router.get('/order-success',userSession,usercontrollers.getOrderSuccess)

router.post('/place-order',usercontrollers.postPlaceOrder)

router.get('/orders',userSession,usercontrollers.getOrders)

router.post('/change-status-order',usercontrollers.postOrderStatus)

router.get('/view-Order-products',userSession,usercontrollers.getViewOrders)

router.get('/product-lists',usercontrollers.getAllProducts)

router.get('/product-list',usercontrollers.getProductList)

router.get('/address',userSession,usercontrollers.getAddress)

router.post('/address',usercontrollers.postAddress)

router.post('/category-products',usercontrollers.postCategoryProducts)

router.get('/user-address/:id',userSession,usercontrollers.getUserAddress)

router.get('/user-profile',userSession,usercontrollers.getUserProfile)

router.post('/user-profile',usercontrollers.postEditProfile)

router.get('/category-lists',usercontrollers.getCategoryLists)

router.post('/remove-cart',usercontrollers.postRemoveCart)

router.get('/edit-address',usercontrollers.getEditAddress)

router.post('/edit-address',usercontrollers.postEditAddress)

router.post('/delete-address/:id',usercontrollers.postDeleteAddress)

router.get('/edit-profile/:id',usercontrollers.getEditProfile)

router.post('/edit-profile/:id',usercontrollers.postEditProfile)

router.get('/user-coupons',userSession,usercontrollers.getUserCoupons)

router.post('/verify-payment',usercontrollers.postVerifyPayment)

router.post('/apply-coupon',usercontrollers.postApplyCoupon)

router.get('/otp-changePassword',usercontrollers.getOtpChangePassword)

router.post('/otp-changePassword',usercontrollers.postOtpChangePassword)

// router.get('/verify-otp-password',usercontrollers.getVerifyOtpChangePassword)

router.post('/verify-otp-password',usercontrollers.postVerifyOtpChangePassword)

router.post('/forgot-password',usercontrollers.postUpdatePassword)

router.get('/view-details',userSession,usercontrollers.getViewDetails)

router.post('/mobileno-verify',usercontrollers.postVerifyNumber)

router.get('/wishlist',userSession,usercontrollers.getWishlist)

router.get('/add-to-wishList',userSession,usercontrollers.getaddToWishlist)

router.post('/remove-wishlist',userSession,usercontrollers.postRemoveWishlist)

module.exports = router;
