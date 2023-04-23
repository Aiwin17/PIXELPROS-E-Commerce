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

module.exports = router;
