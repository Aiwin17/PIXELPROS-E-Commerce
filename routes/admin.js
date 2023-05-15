var express = require('express');
var router = express.Router();
const admincontrollers = require('../controllers/adminControllers');
const productsHelpers = require('../helpers/products-helpers');

/* GET users listing. */
router.get('/',admincontrollers.verifyLogin,admincontrollers.getHome)

router.get('/login',admincontrollers.getLogin)

router.post('/login',admincontrollers.postLogin)

router.get('/logout',admincontrollers.getLogout)

router.get('/view-products',admincontrollers.verifyLogin,admincontrollers.getProducts)

router.get('/add-products',admincontrollers.verifyLogin,admincontrollers.addProduct)

router.post('/add-products',admincontrollers.verifyLogin,admincontrollers.postProduct)

router.get('/edit-products/:id',admincontrollers.getEdit)

router.post('/edit-products/:id',admincontrollers.postEdit)

router.get('/view-users',admincontrollers.getUsers)

router.get('/block-user/:id',admincontrollers.getBlockUser)

router.get('/unblock-user/:id',admincontrollers.getUnBlockUser)

router.get('/delete-products/:id',admincontrollers.getDeleteProducts)

router.get('/add-categories',admincontrollers.getCategory)

router.post('/add-categories',admincontrollers.postCategories)

router.get('/category-list',admincontrollers.getCategoryList)

router.get('/view-banners',admincontrollers.getBanners)

router.post('view-banners',admincontrollers.postAddBanner)

router.get('/add-banner',admincontrollers.getAddBanner)

router.post('/add-banner',admincontrollers.postAddBanner)

router.get('/edit-banner/:id',admincontrollers.getEditBanner)

router.post('/edit-banner/:id',admincontrollers.postEditBanner)

router.get('/admin-orders',admincontrollers.getOrder)

router.post('/change-order-status',admincontrollers.postOrders)

router.get('/edit-category/:id',admincontrollers.getEditCategory)

router.post('/edit-category/:id',admincontrollers.postEditCategory)

router.get('/delete-category/:id',admincontrollers.postDeletecategory)

router.get('/add-coupon',admincontrollers.getAddCoupen)

router.post('/add-coupon',admincontrollers.postAddCoupons)

router.get('/coupons',admincontrollers.getCoupon)

router.get('/delete-coupons/:id',admincontrollers.getDeleteCoupons)

router.get('/view-order-details/:id',admincontrollers.getOrderDetails)

router.get('/graph-statics',admincontrollers.getGraphStatics)

module.exports = router;
