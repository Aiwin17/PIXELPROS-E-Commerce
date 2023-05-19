const productsHelpers = require("../helpers/products-helpers");
const userHelpers = require("../helpers/user-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const { Admin } = require("mongodb");
require("dotenv").config();
module.exports = {
  verifyLogin: (req, res, next) => {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  },
  getHome: async(req, res) => {
    let order = await productsHelpers.getAllOrders()
    let orderCount = order.length ?? 0
    let totalA = await adminHelpers.totalRev()
    let total = totalA[0]?.total ?? 0
    let products = await productsHelpers.productCount() ?? 0
    res.render("admin/index",{orderCount, products, total});
  },
  getLogin: (req, res) => {
    if (req.session.admin) {
      res.redirect("/admin");
    } else {
      res.render("admin/admin-login");
    }
  },
  getLogout: (req, res) => {
    req.session.admin = false;
    res.redirect("/admin");
  },
  postLogin: (req, res) => {
    if (
      req.body.email === process.env.ADMIN_EMAIL &&
      req.body.password === process.env.ADMIN_PASSWORD
    ) {
      req.session.admin = true;
      res.redirect("/admin");
    } else {
      res.redirect("/admin/login");
    }
  },
  getProducts: (req, res) => {
    productsHelpers.getAllProducts().then((products) => {
      res.render("admin/admin-products", { products });
    });
  },
  addProduct: (req, res) => {
    productsHelpers.getAllCategories().then((category) => {
      res.render("admin/add-products", { category });
    });
  },
  postProduct: (req, res) => {
    let image = req.files;
    productsHelpers.addProduct(req.body, image, () => {
      res.redirect("/admin/view-products");
    });
  },
  getEdit: (req, res) => {
    productsHelpers.getProductDetails(req.params).then((product) => {
      res.render("admin/edit-products", { product });
    });
  },
  postEdit: (req, res) => {
    let image = req.files;
    productsHelpers.updateProduct(req.params.id, req.body, image).then(() => {
      res.redirect("/admin/view-products");
    });
  },
  getUsers: (req, res) => {
    adminHelpers.getAllUsers(req.params).then((users) => {
      res.render("admin/admin-users", { users });
    });
  },
  getBlockUser: (req, res) => {
    let id = req.params.id;
    adminHelpers.getBlockUser(id).then(() => {
      res.redirect("/admin/view-users");
    });
  },
  getUnBlockUser: (req, res) => {
    let id = req.params.id;
    adminHelpers.getUnBlockUser(id).then(() => {
      res.redirect("/admin/view-users");
    });
  },
  getDeleteProducts: (req, res) => {
    let id = req.params.id;
    productsHelpers.getDelProducts(id).then(() => {
      res.redirect("/admin/view-products");
    });
  },
  getCategoryList: (req, res) => {
    productsHelpers.getAllCategories().then((categories) => {
      res.render("admin/category-list", { categories });
    });
  },
  getCategory: (req, res) => {
    let categoryErr = ""
    res.render("admin/admin-categories",{categoryErr});
  },
  postCategories: (req, res) => {
    console.log(req.body);
    productsHelpers.addCategories(req.body).then((response) => {
      if(response.status){
        let categoryErr = "Category Already Exist"
        res.render("admin/admin-categories",{categoryErr})
      }else{
        res.redirect("/admin/category-list");
      }
    });
  },
  getBanners: (req, res) => {
    productsHelpers.getBanner().then((banner) => {
      res.render("admin/admin-banners", { banner });
    });
  },

  getAddBanner: (req, res) => {
    res.render("admin/add-banner");
  },
  postAddBanner: (req, res) => {
    let image = req.files;
    productsHelpers.addBanner(req.body, image).then(() => {
      res.redirect("/admin/add-banner");
    });
  },
  getEditBanner: (req, res) => {
    productsHelpers.getBanner().then((banner) => {
      res.render("admin/edit-banner", { banner });
    });
  },
  postEditBanner: (req, res) => {
    let id = req.params.id;
    productsHelpers.editBanner(id, req.body).then(() => {
      res.redirect("admin/edit-banner");
    });
  },
  getOrder: async (req, res) => {
    await adminHelpers.getAllOrders().then((orders) => {
      res.render("admin/admin-orders", { orders });
    });
  },
  postOrders: async (req, res) => {
    let orderId = req.body.order;
    let status = req.body.orderStatus;
    await adminHelpers.postUpdateOrders(status, orderId).then((response) => {
      res.json(response);
    });
  },
  getEditCategory: async (req, res) => {
    let category = await productsHelpers.getCategory(req.params.id);
    res.render("admin/edit-category", { category });
  },
  postEditCategory: async (req, res) => {
    let id = req.params.id;
    await productsHelpers.editCategory(id, req.body).then(() => {
      res.redirect("/admin/category-list");
    });
  },
  postDeletecategory: async (req, res) => {
    let id = req.params.id;
    await productsHelpers.deleteCategory(id).then(() => {
      res.redirect("/admin/category-list");
    });
  },
  getAddCoupen: (req, res) => {
    res.render("admin/add-coupon");
  },
  postAddCoupons: async (req, res) => {
    await productsHelpers.createCoupon(req.body).then(() => {
      res.redirect("/admin/coupons");
    });
  },
  getCoupon: async (req, res) => {
    await productsHelpers.getCouponsList().then((coupons) => {
      console.log(coupons);
      res.render("admin/coupons", { coupons });
    });
  },
  getDeleteCoupons: async (req, res) => {
    let id = req.params.id;
    await productsHelpers.deleteCoupons(id).then((response) => {
      res.json(response);
    });
  },
  getOrderDetails: async (req, res) => {
    let id = req.params.id;
    await userHelpers.getOrderProducts(id).then(async (orderDetails) => {
      await adminHelpers.getOrder(id).then((userDetails) => {
        console.log(userDetails,'///////');
        res.render("admin/view-order-details", { userDetails, orderDetails });
      });
    });
  },
  getGraphStatics: async (req, res) => {
    let orderStatistics = await adminHelpers.getOrdrStatistics();
    let saleStatistics = await adminHelpers.getSaleStatistics();
    res.json({ orderStatistics,saleStatistics});
  },
  getSalesReport:async(req,res)=>{
    await adminHelpers.getAllOrders().then((orders) => {
      res.render("admin/view-salesreport", { orders });
    });
  },
  viewReportByDate: async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const orders = await adminHelpers.getReport(startDate, endDate);
      res.render("admin/view-salesreport", { orders });
    } catch (err) {
      console.error(err);
    }
  },
};
