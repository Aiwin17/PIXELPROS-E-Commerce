var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectID } = require("bson");
var objectId = require("mongodb").ObjectId;
const twilio = require("../twilio");
const Razorpay = require("razorpay");
const { name } = require("ejs");
var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      // let oldUser = db.get().collection(collection.USER_COLLECTION).aggregate([
      //     {

      //         $match: { $and: [{ mobileno: userData.mobileno }, { email: userData.email }] }

      //     },
      // ])
      // if(oldUser){
      //     resolve(true)
      // }else{
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((userData) => {
          resolve(true);
        });
      // }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            if (user.blocked) {
              reject(true);
              return;
            } else {
              response.user = user;
              db.get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { email: userData.email },
                  {
                    $set: {
                      Active: true,
                    },
                  }
                );
              response.status = true;
              resolve(response);
            }
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  getUserDetails: (mobile_no) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobileno: mobile_no });
      if (user) {
        if (user.blocked) {
          reject(true);
          return;
        } else {
          await twilio.sendOtp(mobile_no);
          resolve(true);
        }
      } else {
        resolve(false);
      }
    });
  },
  verifyOtp: (otp, mobileno) => {
    console.log(otp, mobileno);
    otp = otp.join("");
    return new Promise(async (resolve, reject) => {
      let result = await twilio.verifyOtp(mobileno, otp);
      console.log(result);
      if (result) {
        let userData = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ mobileno: mobileno });
        resolve({ status: true, userData });
      } else {
        resolve(false);
      }
    });
  },
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then(() => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },

          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  findUser: async (email) => {
    const user = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .findOne({ email: email });
    return user;
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let carts = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (carts) {
        count = carts.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise(async (resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        await db
          .get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        await db
          .get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },

          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$products", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();
        console.log(total[0]?.total);
      resolve(total[0]?.total);
    });
  },
  placeOrder: (order, products, total, userId) => {
    console.log(order.coupon);
    return new Promise((resolve, reject) => {
      let status = order["payment-method"] === "COD" || order["payment-method"] === "razorpay" ? "processing" : "pending";
      console.log(status);
      let orderObj = {
        deliveryDetails: {
          name: order.name,
          mobile: order.number,
          address: order.address,
          pincode: order.pincode,
        },
        userId: objectId(order.userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        status: status,
        date: Date.now(),
      };
      if(order.coupon){
        db.get().collection(collection.COUPON_COLLECTION).updateOne({name:order.coupon},
          {
            $push:{
              user: objectId(userId)
            }
          })
      }
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .deleteOne({ user: objectId(order.userId) });
          resolve(response.insertedId);
        });
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      resolve(cart.products);
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .toArray();
      resolve(orders);
    });
  },
  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },
  addAddress: (details) => {
    return new Promise(async (resolve, reject) => {
      try {
        const newObjectId = new ObjectID();
        const response = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: new ObjectID(details.userId) },
            {
              $push: {
                address: {
                  _id: newObjectId,
                  ...details,
                },
              },
            }
          );
        resolve({ status: true, newAddressId: newObjectId });
      } catch (error) {
        reject(error);
      }
    });
  },
  postUpdateStatus: (orderId, status) => {
    return new Promise(async (resolve, reject) => {
      if (status === "processing") {
        let orders = db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "Order Cancelling",
              },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      } else if (status === "placed") {
        let orders = db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "Order Returning",
              },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  postCategoryProducts: (categoryData) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .aggregate([
          {
            $match: { "name.category": categoryData.catname },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "_id",
              foreignField: "category",
              as: "categoryDocs",
            },
          },
          {
            $match: { "categoryDocs.Deleted": { $ne: true } },
          },
        ])
        .toArray();
      resolve(products);
    });
  },
  getCategoryList: (categoryData) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(categoryData) },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "_id",
              foreignField: "category",
              as: "categoryDocs",
            },
          },
        ])
        .toArray();
      // console.log(products);
      resolve(products);
    });
  },
  removeCart: (cartDetails) => {
    console.log(cartDetails);
    let cartID = cartDetails.cartId;
    let proID = cartDetails.proId;

    // console.log(cartDetails,'[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[');

    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(cartID) },
          {
            $pull: {
              products: {
                item: objectId(proID),
              },
            },
          }
        )
        .then((response) => {
          resolve({ status: true });
        });
    });
  },
  editUserProfile: (userId, userDetails) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              username: userDetails.username,
              email: userDetails.email,
              mobileno: userDetails.mobileno,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getUsers: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      resolve(user);
    });
  },
  editAddress: (addressDetails, addressId) => {
    console.log(addressDetails, addressId);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          {
            address: { $elemMatch: { _id: objectId(addressId) } },
          },
          {
            $set: {
              "address.$.name": addressDetails.name,
              "address.$.number": addressDetails.number,
              "address.$.address": addressDetails.address,
              "address.$.country": addressDetails.country,
              "address.$.district": addressDetails.district,
              "address.$.pincode": addressDetails.pincode,
            },
          }
        )
        .then((response) => {
          console.log();
          resolve(true);
        });
    });
  },
  getAllCoupon: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find()
        .toArray()
        .then((coupon) => {
          console.log(coupon);
          resolve(coupon);
        });
    });
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log(order);
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  applyCoupon: (couponCode, userId) => {
    return new Promise(async (resolve, reject) => {
      let checkCoupon = await db
        .get()
        .collection(collection.COUPON_COLLECTION)
        .find({ name: couponCode })
        .toArray();
      console.log("coupon code found-------");
      if (checkCoupon.length > 0) {
        let newDate = new Date();
        let expiryDate = new Date(checkCoupon[0].expiry_date)
        const date = new Date(checkCoupon[0].expiry_date);
        checkCoupon[0].expiry_date = date;
        console.log(checkCoupon[0].expiry_date);
        console.log(newDate);
        console.log("coupon checked-----");
        let user = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .aggregate([
            { 
              $match: {name:couponCode} 
            },
            {
              $match:{user:{$in:[userId]}}
            }
          ]).toArray();
        if (user.length == 0) {
          console.log("user not found-----");
          if (expiryDate >= newDate) {
            db.get().collection(collection.COUPON_COLLECTION).updateOne({name:couponCode},{$pull:{user: userId}})
            db.get()
              .collection(collection.COUPON_COLLECTION)
              .updateOne(
                { name: couponCode },
                {
                  $push: {
                    user: userId,
                  },
                }
              );
            console.log("date checked-----");
            let discount = checkCoupon[0].max_discount;
            let cpp = { status: true, discount };
            resolve(cpp);
          } else {
            console.log("coupon expired -----");
            resolve({ status: false });
          }
        } else {
          console.log("user found -----");
          resolve({ status: false });
        }
      } else {
        console.log("invalid code -----");
        resolve({ status: false });
      }
    });
  },
  updatePassword:(password,mobile_no)=>{
    return new Promise(async(resolve,reject)=>{
      let hashedPassword = bcrypt.hashSync(password,4)
      await db.get().collection(collection.USER_COLLECTION)
      .updateOne({mobileno:mobile_no},
        {
          $set:
          {
            password:hashedPassword
          }
        }
      ).then(()=>{
        resolve(true)
      })
    })
  }
}
