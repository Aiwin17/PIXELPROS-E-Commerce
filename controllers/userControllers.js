const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/products-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const generateInvoice = require("../config/pdfKit");
const db = require("../config/connection");
const collection = require("../config/collections");
const { ObjectId } = require("mongodb");

module.exports = {
  middleware: async (req, res, next) => {
    let category = await productHelpers.getAllCategories();
    res.locals.category = category;
    next();
  },

  //User-Signup
  getSignUp: async (req, res) => {
    let signupErr = "";
    res.render("user/user-signup", {
      user: false,
      signupErr,
    });
  },
  postSignUp: async (req, res) => {
    let userExist = await userHelpers.getOldUser(req.body.email);
    if (!userExist) {
      try {
        const user = await userHelpers.doSignup(req.body);
        req.session.userId = user._id;
        req.session.loggedIn = true;
        req.session.user = user;
        res.redirect("/");
      } catch (error) {
        console.error("Signup failed:", error);
        res.status(500).send("Internal Server Error");
      }
    } else {
      let wishlistCount = await userHelpers.getWishlistCount(
        req.session.userId
      );
      let cartCount = await userHelpers.getCartCount(req.session.userId);
      let signupErr = "User already exists!";
      res.render("user/user-signup", {
        user: false,
        cartCount,
        wishlistCount,
        signupErr,
      });
    }
  },

  //User-Login
  getLogin: async (req, res) => {
    if (req.session.loggedIn) {
      res.redirect("/");
    } else {
      const logErr = req.session.loginError;
      if (logErr) {
        req.session.loginError = false;
      }
      res.render("user/user-login", { logErr });
    }
  },

  postLogin: (req, res) => {
    userHelpers.doLogin(req.body).then(async (response) => {
      if (response.status) {
        const email = req.body.email;
        const userData = await userHelpers.findUser(email);
        req.session.userId = userData._id;
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginError = "Invalid username or Password";
        res.redirect("/login");
      }
    });
  },

  //User-Logout
  getLogout: (req, res) => {
    const userData = req.session.user;
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
    res.redirect("/login");
  },

  //Home-Page
  getHome: async (req, res) => {
    let user = req.session.user;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    let banner = await productHelpers.getBanner();
    let products = await productHelpers.getAllProducts();
    let pageCount = req.query.id || 1;
    let pageNum = parseInt(pageCount);
    let limit = 4;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.userId);
    }
    products = await userHelpers.viewTotalProduct(pageNum, limit);
    let totalProducts = products.length;
    let pages = [];
    for (let i = 1; i <= Math.ceil(totalProducts / limit); i++) {
      pages.push(i);
    }
    res.render("user/index", {
      pages,
      products,
      user,
      cartCount,
      banner,
      wishlistCount,
    });
  },

  //Products
  getAllProducts: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    productHelpers.getAllProducts().then((product) => {
      res.render("user/userproduct-list", {
        user: req.session.user,
        cartCount,
        product,
        wishlistCount,
      });
    });
  },

  getSingleProduct: async (req, res) => {
    let id = req.params.id;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    productHelpers.getProducts(id).then((product) => {
      res.render("user/view-product", {
        cartCount,
        product,
        user: req.session.user,
        wishlistCount,
      });
    });
  },

  //OTP
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
    } else {
      req.session.phone = req.body?.mobile_no;
      mobile_no = req.body?.mobile_no;
    }
    userHelpers
      .getUserDetails(mobile_no)
      .then((response) => {
        if (resendCheck) {
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
    await userHelpers
      .updatePassword(req.body.confirmPassword, req.body.mobileno)
      .then(() => {
        res.redirect("/login");
      });
  },
  postVerifyNumber: async (req, res) => {
    await userHelpers.getMobileNumber(req.body.data).then((response) => {
      res.json(response);
    });
  },

  //Cart
  getCart: async (req, res) => {
    try {
      let wishlistCount = await userHelpers.getWishlistCount(
        req.session.userId
      );
      let cartCount = await userHelpers.getCartCount(req.session.userId);
      let products = await userHelpers.getCartProducts(req.session.userId);
      let total = await userHelpers.getTotalAmount(req.session.userId);
      // if (total) {
      res.render("user/view-cart", {
        user: req.session.user,
        products,
        cartCount,
        total,
        wishlistCount,
      });
      // } else {
      //   res.render("user/empty-cart", {
      //     user: req.session.user,
      //     products,
      //     cartCount,
      //     total: 0,
      //     wishlistCount,
      //   });
      // }
    } catch (error) {
      console.log("getCart Error: " + error);
      res.status(500).send("Internal Server Error");
    }
  },
  getaddToCart: (req, res) => {
    console.log(req.query.id);
    userHelpers.addToCart(req.query.id, req.session.userId).then(async () => {
      let wishlistCount = await userHelpers.getWishlistCount(
        req.session.userId
      );
      let cartCount = await userHelpers.getCartCount(req.session.userId);
      res.json({ status: true, cartCount, wishlistCount });
    });
  },
  postRemoveCart: async (req, res) => {
    userHelpers.removeCart(req.body).then((response) => {
      res.json(response);
    });
  },

  //Product-Quatity
  postProQuantity: (req, res) => {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.body.user);
      res.json(response);
    });
  },

  //Place-Order
  getPlaceOrder: async (req, res) => {
    let userId = req.session.userId;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(userId);
    let products = await userHelpers.getCartProductList(userId);
    let orderProducts = products.map((i) => i.item).join(",");
    let placedProducts = await productHelpers.getProducts(orderProducts);
    let coupons = await userHelpers.getAllCoupon();
    if (cartCount === 0) {
      res.redirect("/cart");
      return;
    }
    userHelpers
      .getTotalAmount(userId)
      .then(async (Total) => {
        await userHelpers.getUsers(userId).then((user) => {
          res.render("user/checkout", {
            user,
            cartCount,
            Total,
            wishlistCount,
            coupons,
            products,
            placedProducts,
          });
        });
      })
      .catch((err) => {
        console.log(err.message);
        res.status(500).send("Internal Server Error");
      });
  },
  postPlaceOrder: async (req, res) => {
    let userId = ObjectId(req.session.userId);
    let coupon = req.body.coupon;
    let totalPrice = req.body.total;
    let walletAmount = req.body.wallet;
    let products = await userHelpers.getCartProductList(userId);
    if (coupon) {
      let cpn = await productHelpers.getAllCoupons(coupon);
      let discount = parseInt(cpn.max_discount);
      total = totalPrice - discount;
    } else {
      total = totalPrice;
    }
    userHelpers
      .placeOrder(req.body, products, total, userId, walletAmount)
      .then((orderId) => {
        if (
          req.body.payment_option === "COD" ||
          req.body.payment_option === "wallet"
        ) {
          res.json({ codSuccess: true });
        } else {
          userHelpers.generateRazorpay(orderId, total).then((response) => {
            res.json(response);
          });
        }
      });
  },

  //Orders
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
  postOrderStatus: async (req, res) => {
    let orderId = req.body.orderId;
    let status = req.body.status;
    await userHelpers.postUpdateStatus(orderId, status).then((response) => {
      res.json(response);
    });
  },

  //User-Profile
  getAddress: async (req, res) => {
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    res.render("user/add-address", {
      user: req.session.user,
      cartCount,
      wishlistCount,
    });
  },
  postAddress: async (req, res) => {
    const userId = req.session.userId;
    await userHelpers.addAddress(req.body, userId);
    res.redirect("/checkout");
  },
  getUserAddress: async (req, res) => {
    let userId = req.session.userId;
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
  getEditAddress: async (req, res) => {
    try {
      let user = req.session.user;
      console.log(user, "::");
      console.log(req.query.id, "::");
      const address = user.address.find((item) => {
        return item._id !== req.query.id;
      });
      console.log(address);
      let wishlistCount = await userHelpers.getWishlistCount(
        req.session.userId
      );
      let cartCount = await userHelpers.getCartCount(req.session.userId);
      res.render("user/edit-address", {
        user,
        cartCount,
        address,
        wishlistCount,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("An error occurred. Please try again later.");
    }
  },
  postDeleteAddress: async (req, res) => {
    let id = req.params.id;
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
      res.redirect("/checkout");
    });
  },
  postEditProfile: async (req, res) => {
    let id = req.query.id;
    userHelpers.editUserProfile(id, req.body).then(() => {
      res.redirect("/user-profile");
    });
  },

  //Category
  getCategoryLists: async (req, res) => {
    let user = req.session.user;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    userHelpers.findCategory(req.query.id).then((category) => {
      userHelpers.getCategoryList(category).then((products) => {
        let cat = products[0].categoryDocs;
        res.render("user/category-list", {
          user,
          cartCount,
          cat,
          wishlistCount,
        });
      });
    });
  },
  postCategoryProducts: (req, res) => {
    userHelpers.postCategoryProducts(req.body).then((products) => {
      res.json(products);
    });
  },

  //Coupons
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
    await userHelpers
      .applyCoupon(req.body.couponCode, req.body.userId)
      .then((response) => {
        if (response.status) {
          let total = req.body.total - response.discount;
          res.json({ total, discount: response.discount });
        } else {
          res.json({ status: false });
        }
      });
  },

  //WishList
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
  getWishlist: async (req, res) => {
    let user = req.session.user;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    let products = await userHelpers.getWishListProducts(req.session.userId);
    res.render("user/wishlist", { user, cartCount, wishlistCount, products });
  },
  getaddToWishlist: (req, res) => {
    userHelpers
      .addToWishlist(req.query.id, req.session.userId)
      .then(async (response) => {
        let wishlistCount = await userHelpers.getWishlistCount(
          req.session.userId
        );
        res.json({ status: response.status, wishlistCount });
      });
  },
  postRemoveWishlist: (req, res) => {
    userHelpers.removeWishlist(req.body).then((response) => {
      res.json(response);
    });
  },

  //Invoice
  downloadInvoice: async (req, res) => {
    try {
      const order_id = req.params.id;
      const order = await adminHelpers.getOrder(order_id);
      const productDetails = await userHelpers.getOrderProducts(order_id);
      const invoicePath = await generateInvoice(order, productDetails);
      res.download(invoicePath, (err) => {
        if (err) {
          res.render("../views/user/catchError", {
            message: err.message,
            user: req.session.user,
          });
        }
      });
    } catch (error) {
      res.render("catchError", {
        user: req.session.user,
      });
    }
  },

  //Search
  postSearchProducts: async (req, res) => {
    let user = req.session.user;
    let wishlistCount = await userHelpers.getWishlistCount(req.session.userId);
    let cartCount = await userHelpers.getCartCount(req.session.userId);
    let banner = await productHelpers.getBanner();
    let products = await userHelpers.searchproducts(req.body);
    if (products) {
      res.render("user/index", {
        pages: false,
        products,
        user,
        cartCount,
        banner,
        wishlistCount,
      });
    } else {
      res.render("user/index", {
        err: "Products not Found",
        user,
        cartCount,
        banner,
        wishlistCount,
      });
    }
  },
  getPages: async (req, res) => {
    try {
      let user = req.session.user;
      let pageCount = req.query.id || 1;
      let pageNum = parseInt(pageCount);
      let limit = 4;
      let cartCount = null;
      if (req.session.user) {
        cartCount = await userHelpers.getCartCount(req.session.userId);
      }
      let products = await userHelpers.viewTotalProduct(pageNum, limit);
      let product = await productHelpers.getAllProducts();
      let banner = await productHelpers.getBanner();
      let totalProducts = product.length;
      let pages = [];
      for (let i = 1; i <= Math.ceil(totalProducts / limit); i++) {
        pages.push(i);
      }
      res.render("user/index", { user, products, pages, banner, cartCount });
    } catch (error) {}
  },
};
