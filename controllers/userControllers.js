const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/products-helpers");
var db = require("../config/connection");
var collection = require("../config/collections");
const { response } = require("express");
const { verifyOtp } = require("../twilio");
module.exports = {
  middleware: async (req, res, next) => {
    let category = await productHelpers.getAllCategories();
    res.locals.category = category;
    next();
  },
  getHome: async (req, res) => {
    let user = req.session.user;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    let banner = await productHelpers.getBanner();
    let products = await productHelpers.getAllProducts();
    res.render("user/index", {
      products,
      user,
      cartCount,
      banner,
      wishlistCount,
    });
  },
  getLogin: async (req, res) => {
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    res.render("user/user-login", { user: false, cartCount });
  },
  postLogin: (req, res) => {
    userHelpers
      .doLogin(req.body)
      .then(async (response) => {
        if (response.status) {
          const email = req.body.email;
          const userData = await userHelpers.findUser(email);
          req.session.userId = userData._id;
          req.session.loggedIn = true;
          req.session.user = response.user;
          res.redirect("/");
        } else {
          res.redirect("/login");
        }
      })
      .catch(() => {
        res.redirect("/login");
      });
  },
  getLogout: (req, res) => {
    let userData = req.session.user;
    db.get()
      .collection(collection.USER_COLLECTION)
      .updateOne(
        { email: userData.email },
        {
          $set: {
            Active: false,
          },
        }
      );
    req.session.loggedIn = false;
    req.session.user = false;
    res.redirect("/");
  },
  getSignUp: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    res.render("user/user-signup", { user: false, cartCount, wishlistCount });
  },
  postSignUp: (req, res) => {
    userHelpers.doSignup(req.body).then(() => {
      res.redirect("/login");
    });
  },
  getProducts: async (req, res) => {
    let id = req.query.id;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    productHelpers.getProducts(id).then((products) => {
      res.render("user/userproduct-list", {
        cartCount,
        products,
        user: req.session.user,
        wishlistCount,
      });
    });
  },
  getOtpLogin: async (req, res) => {
    let checkUser = req.query.user;
    console.log(checkUser);
    if (checkUser) {
      res.render("user/otp-Login", { user: false, error: true });
    } else {
      let cartCount = await userHelpers.getCartCount(req.session.userId);
      res.render("user/otp-Login", {
        user: req.session.user,
        cartCount,
        error: false,
      });
    }
  },
  postOtpLogin: (req, res) => {
    let mobile_no;
    let resendCheck = req.body?.resend;
    if (resendCheck) {
      mobile_no = req.session.phone;
      console.log(req.body?.resend, "nnnnnnnnnnnnnnn");
    } else {
      req.session.phone = req.body?.mobile_no;
    }
    userHelpers
      .getUserDetails(mobile_no)
      .then((response) => {
        console.log("0000000");
        if (resendCheck) {
          console.log("000011111000");
          res.json({ status: true });
        } else {
          res.redirect("/verify-otp");
        }
      })
      .catch(() => {
        res.redirect("/otp-Login?user=false");
      });
  },
  getVerifyOtp: async (req, res) => {
    res.render("user/verify-otp", { user: false });
  },
  postVerifyOtp: (req, res) => {
    let mobileno = req.session.phone;
    let otp = req.body.number;
    userHelpers.verifyOtp(otp, mobileno).then((response) => {
      if (response.status) {
        req.session.user = response.userData;
        req.session.loggedIn = true;
        res.redirect("/");
      } else {
        let mobile_no = mobileno;
        res.render("user/verify-otp", { mobile_no });
      }
    });
  },
  getCart: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    let products = await userHelpers.getCartProducts(req.session.userId);
    let total = await userHelpers.getTotalAmount(req.session.userId);
    console.log(products);
    if (total) {
      res.render("user/addtocart", {
        user: req.session.user,
        products,
        cartCount,
        total,
        wishlistCount,
      });
    } else {
      res.render("user/empty-cart", {
        user: req.session.user,
        products,
        cartCount,
        total: 0,
        wishlistCount,
      });
    }
  },
  getaddToCart: (req, res) => {
    userHelpers.addToCart(req.query.id, req.session.userId).then(async () => {
      let wishlistCount = await userHelpers.getWishlistCount(
        req.session.userId
      );
      let cartCount = await userHelpers.getCartCount(req.session.userId);
      res.json({ status: true, cartCount, wishlistCount });
    });
  },
  postProQuantity: (req, res) => {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.body.user);
      res.json(response);
    });
  },
  getPlaceOrder: async (req, res) => {
    let userId = req.session.userId;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(userId);
    userHelpers
      .getTotalAmount(userId)
      .then(async (Total) => {
        await userHelpers.getUsers(userId).then((user) => {
          res.render("user/place-order", {
            user,
            cartCount,
            Total,
            wishlistCount,
          });
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send("Internal Server Error");
      });
  },
  postPlaceOrder: async (req, res) => {
    let userId = req.session.userId;
    let coupon = req.body.coupon;

    console.log(coupon, "coupon///////////////////////////////////");
    let products = await userHelpers.getCartProductList(userId);
    let totalPrice = await userHelpers.getTotalAmount(userId);
    if (coupon) {
      let cpn = await productHelpers.getAllCoupons(coupon);
      console.log(cpn);
      let discount = parseInt(cpn.max_discount);
      total = totalPrice - discount;
    } else {
      total = totalPrice;
    }

    console.log(req.body.discountPrice);
    userHelpers
      .placeOrder(req.body, products, total, req.session.userId)
      .then((orderId) => {
        if (req.body.payment_option === "COD") {
          res.json({ codSuccess: true });
        } else {
          console.log(total, "////////////////////////////////////////");
          userHelpers.generateRazorpay(orderId, total).then((response) => {
            res.json(response);
          });
        }
      });
  },
  getOrderSuccess: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    res.render("user/order-success", {
      user: req.session.user,
      cartCount,
      wishlistCount,
    });
  },
  getOrders: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    let orders = await userHelpers.getUserOrders(req.session.userId);
    res.render("user/orders", {
      user: req.session.user,
      orders,
      cartCount,
      wishlistCount,
    });
  },
  getViewOrders: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    let products = await userHelpers.getOrderProducts(req.query.id);
    res.render("user/view-orders", {
      user: req.session.user,
      products,
      cartCount,
      wishlistCount,
    });
  },
  getAllProducts: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    productHelpers.getAllProducts().then((product) => {
      res.render("user/userproduct-list", {
        cartCount,
        product,
        wishlistCount,
      });
    });
  },
  getProductList: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    productHelpers.getAllProducts().then((product) => {
      res.render("user/category", {
        user: req.session.user,
        cartCount,
        product,
        wishlistCount,
      });
    });
  },
  getAddress: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    res.render("user/address", {
      user: req.session.user,
      cartCount,
      wishlistCount,
    });
  },
  postAddress: async (req, res) => {
    console.log(req.body);
    let address = await userHelpers.addAddress(req.body);
    res.redirect("/address");
  },
  postOrderStatus: async (req, res) => {
    let orderId = req.body.orderId;
    let status = req.body.status;
    await userHelpers.postUpdateStatus(orderId, status).then((response) => {
      res.json(response);
    });
  },
  postCategoryProducts: (req, res) => {
    userHelpers.postCategoryProducts(req.body).then((products) => {
      res.json(products);
    });
  },
  getUserAddress: async (req, res) => {
    let userId = req.session.userId;
    console.log(userId, "///////////////////////////////");
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    await userHelpers.getUsers(userId).then((user) => {
      res.render("user/user-address", { user, cartCount, wishlistCount });
    });
  },
  getUserProfile: async (req, res) => {
    let userId = req.session.userId;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    await userHelpers.getUsers(userId).then(async (user) => {
      let orders = await userHelpers.getUserOrders(req.session.userId);
      res.render("user/user-profile", {
        user,
        orders,
        cartCount,
        wishlistCount,
      });
    });
  },

  getCategoryLists: async (req, res) => {
    let user = req.session.user;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    userHelpers.getCategoryList(req.query.id).then((products) => {
      let cat = products[0].categoryDocs;
      res.render("user/category-list", { user, cartCount, cat, wishlistCount });
    });
  },
  postRemoveCart: async (req, res) => {
    // console.log(req.body.cart);
    userHelpers.removeCart(req.body).then((response) => {
      console.log(response);
      res.json(response);
    });
  },
  getEditAddress: async (req, res) => {
    let user = req.session.user;
    const address = user.address.find((item) => {
      return item._id == req.query.id;
    });
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    res.render("user/edit-address", {
      user,
      cartCount,
      address,
      wishlistCount,
    });
  },
  postDeleteAddress: async (req, res) => {
    let id = req.params.id;
    console.log(id, "//////////////////////////////////////");
    await userHelpers.deleteAddress(id).then((response) => {
      res.json(response);
    });
  },
  getEditProfile: async (req, res) => {
    let userId = req.session.userId;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    await userHelpers.getUsers(userId).then((user) => {
      res.render("user/edit-profile", { user, cartCount, wishlistCount });
    });
  },
  postEditAddress: async (req, res) => {
    let addressId = req.query.id;
    await userHelpers.editAddress(req.body, addressId).then(() => {
      res.redirect("/user-profile");
    });
  },
  postEditProfile: async (req, res) => {
    let id = req.query.id;
    console.log(req.body);
    userHelpers.editUserProfile(id, req.body).then(() => {
      res.redirect("/user-profile");
    });
  },
  getUserCoupons: async (req, res) => {
    let user = req.session.user;
    await userHelpers.getAllCoupon().then(async (coupons) => {
      let wishlistCount = await userHelpers.getWishlistCount(
        req.session.userId
      );
      let cartCount = await userHelpers.getCartCount(req.session.userId);
      res.render("user/user-coupons", {
        cartCount,
        user,
        coupons,
        wishlistCount,
      });
    });
  },
  postVerifyPayment: (req, res) => {
    console.log(req.body);
    userHelpers
      .verifyPayment(req.body)
      .then(() => {
        userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
          res.json({ status: true });
        });
      })
      .catch((err) => {
        res.json({ status: false });
      });
  },
  postApplyCoupon: async (req, res) => {
    console.log(req.body, "couponnnnnnnn checked");
    await userHelpers
      .applyCoupon(req.body.couponCode, req.body.userId)
      .then((response) => {
        console.log(response);
        if (response.status) {
          console.log(response);
          let total = req.body.total - response.discount;
          res.json({ total, discount: response.discount });
        } else {
          console.log("invalid coupon");
          res.json({ status: false });
        }
      });
  },
  getOtpChangePassword: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    res.render("user/otp-changePassword", {
      user: req.session.user,
      cartCount,
      wishlistCount,
    });
  },
  postOtpChangePassword: async (req, res) => {
    let mobile_no = req.body.mobile_no;
    userHelpers.getUserDetails(mobile_no).then(() => {
      res.render("user/verify-otp-password", { mobile_no });
    });
  },
  // getVerifyOtpChangePassword:(req,res)=>{
  //     res.render('user/verify-otp-password',{user:false})
  // },
  postVerifyOtpChangePassword: async (req, res) => {
    let mobileno = req.body.mobileNo;
    let otp = req.body.number;
    userHelpers.verifyOtp(otp, mobileno).then((response) => {
      if (response.status) {
        res.render("user/forgot-password", { user: false, mobileno });
      } else {
        res.redirect("/user/verify-otp-password");
      }
    });
  },
  postUpdatePassword: async (req, res) => {
    console.log(req.body);
    await userHelpers
      .updatePassword(req.body.confirmPassword, req.body.mobileno)
      .then(() => {
        res.redirect("/login");
      });
  },
  getViewDetails: async (req, res) => {
    let user = req.session.user;
    let id = req.query.id;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    await userHelpers.getOrderProducts(id).then(async (orderDetails) => {
      let orderId = orderDetails[0]._id;
      await userHelpers.getOrderDetails(orderId).then((orders) => {
        res.render("user/view-details", {
          user,
          orders,
          cartCount,
          orderDetails,
          wishlistCount,
        });
      });
    });
  },
  postVerifyNumber: async (req, res) => {
    console.log(req.body.data);
    await userHelpers.getMobileNumber(req.body.data).then((response) => {
      res.json(response);
    });
  },
  getWishlist: async (req, res) => {
    let user = req.session.user;
    console.log(req.session.userId,"userId///////////////");
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    let products = await userHelpers.getWishListProducts(req.session.userId);
    res.render("user/wishlist", { user, cartCount, wishlistCount,products });
  },
  getaddToWishlist: (req, res) => {
    console.log(req.query.id, req.session.userId);
    userHelpers
      .addToWishlist(req.query.id, req.session.userId)
      .then(async (status) => {
        let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
        res.json({status,wishlistCount});
      })
  },
  postRemoveWishlist:(req,res)=>{
    console.log(req.body);
    userHelpers.removeWishlist(req.body).then((response) => {
      console.log(response);
      res.json(response);
    });
  }
};
