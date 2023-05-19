var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectID } = require("bson");
var objectId = require("mongodb").ObjectId;
const twilio = require("../twilio");
const Razorpay = require("razorpay");
const { name } = require("ejs");
const { resolve } = require("path");
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
      userData.wallet = parseInt(userData.wallet);
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
  getOldUser:(email)=>{
    return new Promise(async(resolve,reject)=>{
      let oldUser = await db.get().collection(collection.USER_COLLECTION).findOne({email:email})
        resolve(oldUser)
    })
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
    console.log(typeof mobile_no);
    return new Promise(async (resolve, reject) => {
      let user = await 
      db.get().collection(collection.USER_COLLECTION).find({ mobileno: mobile_no });
      if (user) {
        if (user.blocked) {
          reject(true);
          return;
        } else {
          twilio.sendOtp(mobile_no);
          resolve({ status: true });
        }
      } else {
        reject(true);
      }
    });
  },
  verifyOtp: (otp, mobileno) => {
    console.log(otp, mobileno);
    otp = otp.join("");
    return new Promise(async (resolve, reject) => {
      let result = await twilio.verifyOtp(mobileno, otp);
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
            .then(() => {
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
    console.log(products);
    let quantity = products.quantity;
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne(
          {
            _id: objectId(userId),
            address: { $elemMatch: { _id: objectId(order.address) } },
          },
          {
            projection: {
              _id: 0,
              "address.$": 1,
            },
          }
        );
      let orderId = "ODID" + Math.floor(Math.random() * 1000000);
      let status =
        order.payment_option === "COD" || order.payment_option === "razorpay"
          ? "placed"
          : "Order Failed";
      let orderObj = {
        orderid:orderId,
        deliveryDetails: {
          name: address.address[0].name,
          mobile: address.address[0].number,
          address: address.address[0].address,
          pincode: address.address[0].pincode,
        },
        userId: objectId(userId),
        paymentMethod: order.payment_option,
        products: products,
        totalAmount: total,
        status: status,
        date: new Date(),
      };
      if (order.coupon) {
        db.get()
          .collection(collection.COUPON_COLLECTION)
          .updateOne(
            { name: order.coupon },
            {
              $push: {
                user: objectId(userId),
              },
            }
          );
      }
      if (status === "Order Failed") {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .insertOne(orderObj)
          .then((response) => {
            resolve(response.insertedId);
          });
      } else {
        await products.forEach((i) => {
          db.get()
            .collection(collection.PRODUCT_COLLECTION)
            .updateOne(
              { _id: new objectId(i.item) },
              { $inc: { stock: -i.quantity } }
            );
        });

        db.get()
          .collection(collection.ORDER_COLLECTION)
          .insertOne(orderObj)
          .then((response) => {
            db.get()
              .collection(collection.CART_COLLECTION)
              .deleteOne({ user: objectId(userId) });
            resolve(response.insertedId);
          });
      }
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      console.log(cart.products, "///////////////////////////////////////");
      resolve(cart.products);
    });
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .sort({ date: -1 }) // sort by creation date in descending order
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
      if (status === "placed") {
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
      } else if (status === "Delivered") {
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




  /* The above code is defining a function called `postCategoryProducts` that takes in a parameter
  called `categoryData`. The function returns a Promise that resolves to an array of products that
  belong to the category specified in `categoryData.catname`. */
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
  findCategory:(categoryId)=>{
    return new Promise(async(resolve,reject)=>{
      await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id: objectId(categoryId)}).then((category)=>{
        resolve(category)
      })
    })
  },
  getCategoryList: (categoryName) => {
    let catName = categoryName.name
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .aggregate([
          {
            $match: { name: catName },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "name",
              foreignField: "category",
              as: "categoryDocs",
            },
          },
        ])
        .toArray();
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
          resolve(true);
        });
    });
  },
  deleteAddress: (addressId) => {
    console.log(addressId);
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
              "address.$.deleted": true,
            },
          }
        )
        .then(() => {
          resolve({ status: true });
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
      if (checkCoupon.length > 0) {
        let newDate = new Date();
        let expiryDate = new Date(checkCoupon[0].expiry_date);
        const date = new Date(checkCoupon[0].expiry_date);
        checkCoupon[0].expiry_date = date;
        console.log(checkCoupon[0].expiry_date);
        console.log(newDate);
        let user = await db
          .get()
          .collection(collection.COUPON_COLLECTION)
          .aggregate([
            {
              $match: { name: couponCode },
            },
            {
              $match: { user: { $in: [userId] } },
            },
          ])
          .toArray();
        if (user.length == 0) {
          if (expiryDate >= newDate) {
            db.get()
              .collection(collection.COUPON_COLLECTION)
              .updateOne({ name: couponCode }, { $pull: { user: userId } });
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
            let discount = checkCoupon[0].max_discount;
            let cpp = { status: true, discount };
            resolve(cpp);
          } else {
            resolve({ status: false });
          }
        } else {
          resolve({ status: false });
        }
      } else {
        resolve({ status: false });
      }
    });
  },
  updatePassword: (password, mobile_no) => {
    return new Promise(async (resolve, reject) => {
      let hashedPassword = bcrypt.hashSync(password, 4);
      await db
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { mobileno: mobile_no },
          {
            $set: {
              password: hashedPassword,
            },
          }
        )
        .then(() => {
          resolve(true);
        });
    });
  },
  getOrderDetails: (id) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: id })
        .toArray();
      resolve(orders);
    });
  },
  getMobileNumber: (mobileNo) => {
    return new Promise(async (resolve, reject) => {
      let mobileNo = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobileno: mobileNo });
      resolve({ status: true });
    });
  },
  addToWishlist: async (proId, userId) => {
    return new Promise(async(resolve,reject)=>{
    const proObj = {
      item: objectId(proId),
    };
    try {
      const userWishlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userWishlist) {
        const proExistIndex = userWishlist.products.findIndex(
          (product) => product.item == proId
        );
        if (proExistIndex === -1) {
          await db
            .get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            );
            resolve({status:true});
        } else {
          await db
            .get()
            .collection(collection.WISHLIST_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $pull: { products: proObj },
              }
            );
            resolve({status:false});
        }
      } else {
        const wishListObj = {
          user: objectId(userId),
          products: [proObj],
        };
        await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(wishListObj);
          resolve({status:true});
      }
   
    
    }catch (error) {
      return Promise.reject(error);
    }
  })
  },
  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wishList = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (wishList) {
        count = wishList.products.length;
      }
      resolve(count);
    });
  },
  getWishListProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishListItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
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
              product: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();
      resolve(wishListItems);
    });
  },
  removeWishlist: (wishlistDetails) => {
    console.log(wishlistDetails);
    let wishlistId = wishlistDetails.wishListId;
    let proID = wishlistDetails.proId;

    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .updateOne(
          { _id: objectId(wishlistId) },
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
};
