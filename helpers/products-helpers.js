var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const product = require("../config/collections");
module.exports = {
  addProduct: async (product, image, callback) => {
    console.log(product);
    let imagesFiles = image.map((file) => file.filename);
    let categoryId = await db
      .get()
      .collection(collection.CATEGORY_COLLECTION)
      .find({ name: product.category }, { projection: { _id: 1 } })
      .toArray();
    db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .insertOne({
        name: product.productname,
        category: product.category,
        price: Number(product.price),
        stock: Number(product.quantity),
        description: product.description,
        image: imagesFiles,
      })
      .then((data) => {
        callback(data.insertedId);
      });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Deleted: { $not: { $eq: true } } })
        .toArray();
      resolve(products);
    });
  },
  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(prodId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  updateProduct: (prodId, proDetails, image) => {
    let imagesFiles = image.map((file) => file.filename);
    if (imagesFiles.length === 0) {
      return new Promise(async (resolve, reject) => {
        let categoryId = await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .find(
            { "name.category": proDetails.category },
            { projection: { _id: 1 } }
          )
          .toArray();
        console.log(proDetails);
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(prodId) },
            {
              $set: {
                name: proDetails.productname,
                category: proDetails.category,
                description: proDetails.description.trim(),
                stock: Number(proDetails.quantity),
                price: Number(proDetails.price),
              },
            }
          )
          .then((response) => {
            resolve(true);
          });
      });
    } else {
      return new Promise(async (resolve, reject) => {
        let categoryId = await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .find(
            { "name.category": product.category },
            { projection: { _id: 1 } }
          )
          .toArray();
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(prodId) },
            {
              $set: {
                name: proDetails.productname,
                category: categoryId[0],
                description: proDetails.description.trim(),
                price: proDetails.price,
                image: imagesFiles,
              },
            }
          )
          .then((response) => {
            resolve(true);
          });
      });
    }
  },
  getDelProducts: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              Deleted: true,
            },
          }
        );
      resolve(true);
    });
  },
  addCategories: (category) => {
    return new Promise((resolve, reject) => {
      let cat = category.category.toUpperCase();
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ name: cat })
        .then((data) => {
          if (data) {
            resolve({ status: true });
          } else {
            db.get()
              .collection(collection.CATEGORY_COLLECTION)
              .insertOne({ name: cat })
              .then((data) => {
                resolve({ status: false });
              });
          }
        });
    });
  },
  getAllCategories: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let categories = await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .find()
          .toArray();
        let cat = [];
        for (let category of categories) {
          cat.push(category.name.category);
        }
        resolve(categories);
      } catch (error) {
        reject(error);
      }
    });
  },
  getProducts: (proID) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ _id: objectId(proID) })
        .toArray();
      resolve(products);
    });
  },
  addBanner: (banner, image) => {
    return new Promise((resolve, reject) => {
      let imagesFiles = image.map((file) => file.filename);
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .insertOne({
          name: banner.bannername,
          image: imagesFiles,
        })
        .then((data) => {
          resolve(data.insertedId);
        });
    });
  },
  getBanner: () => {
    return new Promise(async (resolve, reject) => {
      let banner = await db
        .get()
        .collection(collection.BANNER_COLLECTION)
        .find()
        .toArray();
      resolve(banner);
    });
  },
  editBanner: (banId, banDetails) => {
    let imagesFiles = image.map((file) => file.filename);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.BANNER_COLLECTION)
        .updateOne(
          { _id: objectId(banId) },
          {
            $set: {
              name: banDetails.bannername,
              image: imagesFiles,
            },
          }
        )
        .then(() => {
          resolve(true);
        });
    });
  },
  getCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .findOne({ _id: objectId(categoryId) })
        .then((category) => {
          resolve(category);
        });
    });
  },
  editCategory: (categoryId, catDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(categoryId) },
          {
            $set: {
              "name.category": catDetails.category,
            },
          }
        )
        .then(() => {
          resolve(true);
        });
    });
  },
  deleteCategory: (categoryId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .updateOne(
          { _id: objectId(categoryId) },
          {
            $set: {
              Deleted: true,
            },
          }
        );
      resolve(true);
    });
  },
  createCoupon: (couponDetails) => {
    console.log("This is coupon ", couponDetails.expirydate);

    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.COUPON_COLLECTION)
        .insertOne({
          name: couponDetails.couponcode,
          max_discount: Number(couponDetails.discount),
          expiry_date: couponDetails.expirydate,
        })
        .then(() => {
          resolve(true);
        });
    });
  },
  getAllCoupons: (coupon) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .findOne({ name: coupon })
        .then((coupons) => {
          resolve(coupons);
        });
    });
  },
  deleteCoupons: (couponId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .updateOne(
          { _id: objectId(couponId) },
          {
            $set: {
              Deleted: true,
            },
          }
        )
        .then(() => {
          resolve({ status: true });
        });
    });
  },
  getAllProductOrders: (proId) => {
    console.log(proId);
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ _id: proId })
        .toArray();
      resolve(products);
    });
  },
  getCouponsList: () => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray();
      resolve(coupons);
    });
  },
  getAllOrders: async() => {
    let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({date: -1}).toArray();
    return orders;
},
productCount: async()=>{
  let countProducts = await db.get().collection(collection.PRODUCT_COLLECTION).countDocuments()
  return countProducts
},
};
