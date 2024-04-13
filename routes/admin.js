var express = require("express");
var router = express.Router();
const adminControllers = require("../controllers/adminControllers");
const upload = require("../utils/multer");

//Admin Login & Logout

router.get("/", adminControllers.verifyLogin, adminControllers.getHome);

router.get("/login", adminControllers.getLogin);

router.post("/login", adminControllers.postLogin);

router.get("/logout", adminControllers.getLogout);

//products

router.get(
  "/view-products",
  adminControllers.verifyLogin,
  adminControllers.getProducts
);

router.get(
  "/add-products",
  adminControllers.verifyLogin,
  adminControllers.addProduct
);

router.post(
  "/add-products",
  adminControllers.verifyLogin,
  upload.array("image", 4),
  adminControllers.postProduct
);

router.get("/edit-products/:id", adminControllers.getEdit);

router.post("/edit-products/:id", adminControllers.postEdit);

router.get("/delete-products/:id", adminControllers.getDeleteProducts);

//Users

router.get("/view-users", adminControllers.getUsers);

router.get("/block-user/:id", adminControllers.getBlockUser);

router.get("/unblock-user/:id", adminControllers.getUnBlockUser);

//Categories

router.get("/add-categories", adminControllers.getCategory);

router.post("/add-categories", adminControllers.postCategories);

router.get("/category-list", adminControllers.getCategoryList);

router.post("/edit-category/:id", adminControllers.postEditCategory);

router.get("/remove-category/:id", adminControllers.postRemovecategory);

//Banners

router.get("/view-banners", adminControllers.getBanners);

router.post("view-banners", adminControllers.postAddBanner);

router.get("/add-banner", adminControllers.getAddBanner);

router.post("/add-banner", adminControllers.postAddBanner);

router.get("/edit-banner/:id", adminControllers.getEditBanner);

router.post("/edit-banner/:id", adminControllers.postEditBanner);

//Orders

router.get("/admin-orders", adminControllers.getOrder);

router.post("/change-order-status", adminControllers.postOrders);

router.get("/edit-category/:id", adminControllers.getEditCategory);

router.get("/view-order-details/:id", adminControllers.getOrderDetails);

//Coupons

router.get("/add-coupon", adminControllers.getAddCoupen);

router.post("/add-coupon", adminControllers.postAddCoupons);

router.get("/coupons", adminControllers.getCoupon);

router.get("/delete-coupons/:id", adminControllers.getDeleteCoupons);

//Graph And Chart

router.get("/graph-statics", adminControllers.getGraphStatics);

//SalesReport

router.get(
  "/view-sales-report",
  adminControllers.verifyLogin,
  adminControllers.getSalesReport
);

router.post(
  "/sales-report",
  adminControllers.verifyLogin,
  adminControllers.viewReportByDate
);

module.exports = router;
