const productsHelpers = require("../helpers/products-helpers");
const userHelpers = require("../helpers/user-helpers");
require("dotenv").config();
module.exports = {
  verifyLogin: (req, res, next) => {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  },
  getHome: (req, res) => {
    res.render("admin/index");
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
    productsHelpers.getAllCategories().then((category)=>{
      res.render("admin/add-products",{category});
    })
  },
  postProduct: (req, res) => {
    let image = req.files;
    productsHelpers.addProduct(req.body, image, () => {
      res.redirect("/admin/add-products");
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
    userHelpers.getAllUsers(req.params).then((users) => {
      res.render("admin/admin-users", { users });
    });
  },
  getBlockUser: (req, res) => {
    let id = req.params.id;
    userHelpers.getBlockUser(id).then(() => {
      res.redirect("/admin/view-users");
    });
  },
  getUnBlockUser: (req, res) => {
    let id = req.params.id;
    userHelpers.getUnBlockUser(id).then(() => {
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
      res.render("admin/category-list", { categories});
    });
  },
  getCategory:(req,res)=>{
    productsHelpers.getAllCategories().then((cat)=>{
    res.render('admin/admin-categories',{cat})
    })
  },
  postCategories: (req, res) => {
      productsHelpers.addCategories(req.body).then(()=>{
        res.redirect("/admin/add-categories");
      })
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
    await userHelpers.getAllOrders().then((orders)=>{
      res.render("admin/admin-orders", { orders });
    });
  },
  postOrders:async(req,res)=>{
   let orderId = req.body.order
   let status = req.body.orderStatus
   await userHelpers.postUpdateOrders(status,orderId).then((response)=>{
    res.json(response)
   })
  }
};
