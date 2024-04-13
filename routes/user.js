const express = require("express");
const router = express.Router();
const usercontrollers = require("../controllers/userControllers");
let { userSession, loginSession } = require("../middleware/session");
router.use(usercontrollers.middleware);

//User Login And Logout
router.get("/", usercontrollers.getHome);

router.get("/login", loginSession, usercontrollers.getLogin);

router.post("/login", usercontrollers.postLogin);

router.get("/logout", usercontrollers.getLogout);

//User SignUp
router.get("/signup", loginSession, usercontrollers.getSignUp);

router.post("/signup", usercontrollers.postSignUp);

//Shop Page
router.get("/product-lists", usercontrollers.getAllProducts);

//Otp Section
router.get("/otp-Login", loginSession, usercontrollers.getOtpLogin);

router.post("/otp-login", usercontrollers.postOtpLogin);

router.get("/verify-otp", loginSession, usercontrollers.getVerifyOtp);

router.post("/verify-otp", usercontrollers.postVerifyOtp);

router.get(
  "/otp-changePassword",
  loginSession,
  usercontrollers.getOtpChangePassword
);

router.post("/otp-changePassword", usercontrollers.postOtpChangePassword);

router.post("/mobileno-verify", usercontrollers.postVerifyNumber);

router.post(
  "/verify-otp-password",
  usercontrollers.postVerifyOtpChangePassword
);

router.post("/forgot-password", usercontrollers.postUpdatePassword);

//Cart Section
router.get("/cart", userSession, usercontrollers.getCart);

router.get("/add-to-cart", userSession, usercontrollers.getaddToCart);

router.post("/change-product-quantity", usercontrollers.postProQuantity);

router.post("/remove-cart", usercontrollers.postRemoveCart);

//WishList
router.get("/wishlist", userSession, usercontrollers.getWishlist);

router.get("/add-to-wishList", userSession, usercontrollers.getaddToWishlist);

router.post(
  "/remove-wishlist",
  userSession,
  usercontrollers.postRemoveWishlist
);

//PlaceOrder
router.get("/place-order", userSession, usercontrollers.getPlaceOrder);

router.post("/place-order", usercontrollers.postPlaceOrder);

router.post("/verify-payment", usercontrollers.postVerifyPayment);

//Orders
router.get("/order-success", userSession, usercontrollers.getOrderSuccess);

router.get("/orders", userSession, usercontrollers.getOrders);

router.post("/change-status-order", usercontrollers.postOrderStatus);

router.get("/view-Order-products", userSession, usercontrollers.getViewOrders);

router.get("/view-details", userSession, usercontrollers.getViewDetails);

router.get(
  "/download-invoice/:id",
  userSession,
  usercontrollers.downloadInvoice
);

//Category
router.get("/single-product/:id", usercontrollers.getSingleProduct);

router.post("/category-products", usercontrollers.postCategoryProducts);

router.get("/category-lists", usercontrollers.getCategoryLists);

//Address

router.get("/address", userSession, usercontrollers.getAddress);

router.post("/address", usercontrollers.postAddress);

router.get("/user-address/:id", userSession, usercontrollers.getUserAddress);

router.get("/edit-address", usercontrollers.getEditAddress);

router.post("/edit-address", usercontrollers.postEditAddress);

router.post("/delete-address/:id", usercontrollers.postDeleteAddress);

//User-Profile
router.get("/user-profile", userSession, usercontrollers.getUserProfile);

router.post("/user-profile", usercontrollers.postEditProfile);

router.get("/edit-profile/:id", usercontrollers.getEditProfile);

router.post("/edit-profile/:id", usercontrollers.postEditProfile);

//Coupons
router.get("/user-coupons", userSession, usercontrollers.getUserCoupons);

router.post("/apply-coupon", usercontrollers.postApplyCoupon);

//search
router.post("/search", userSession, usercontrollers.postSearchProducts);

router.get("/productPagination", userSession, usercontrollers.getPages);

// router.get('/verify-otp-password',usercontrollers.getVerifyOtpChangePassword)
// router.get('/product-lists',usercontrollers.getAllProducts)

module.exports = router;
