const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectID } = require("bson");
const objectId = require("mongodb").ObjectId;

module.exports = {
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },
  getBlockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectID(id) },
          {
            $set: {
              blocked: true,
            },
          }
        );
      resolve(true);
    });
  },
  getUnBlockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectID(id) },
          {
            $set: {
              blocked: false,
            },
          }
        );
      resolve(true);
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({date:-1})
        .toArray();
      resolve(orders);
    });
  },
  postUpdateOrders: (status, orderId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) });
      let userId = orders.userId
      let returnAmount = orders.totalAmount
      let products = orders.products;
      for (let i = 0; i < products.length; i++) {
        let product = products[i];
        let productDetails = await db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ _id: objectId(product.item) });
      }
  
      if (status === "placed") {
        await db.get().collection(collection.ORDER_COLLECTION).updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "Delivered",
            },
          }
        );
        resolve({ shipped: true });
      } else if (status === "Order Cancelling") {
        await db.get().collection(collection.ORDER_COLLECTION).updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "Order Cancelled",
            },
          }
        );
        const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {$and:[
              { status: "Order Cancelled"}
              ,{userId:userId}
            ]
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: { $toInt: "$totalAmount" } }
            }
          },
          {
            $project: {
              _id: 0,
              totalAmount: 1
            }
          }
        ]).toArray();
        
        const walletAmount = result.length > 0 ? result[0].totalAmount : 0;
        
        await db.get().collection(collection.USER_COLLECTION).updateOne(
          { _id: userId },
          {
            $set: {
              wallet: walletAmount
            }
          }
        );
        for (let i = 0; i < products.length; i++) {
          let product = products[i];
          await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
            { _id: new objectId(product.item) },
            { $inc: { stock: product.quantity } }
          );
        }
        resolve({ cancel:true });
      }else if(status === "Order Returning"){
        await db.get().collection(collection.ORDER_COLLECTION).updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "Order Returned",
            },
          }
        );
        const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {$and:[
              { status: "Order Returned"}
              ,{userId:userId}
            ]
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: { $toInt: "$totalAmount" } }
            }
          },
          {
            $project: {
              _id: 0,
              totalAmount: 1
            }
          }
        ]).toArray();
        
        const walletAmount = result.length > 0 ? result[0].totalAmount : 0;
        
        await db.get().collection(collection.USER_COLLECTION).updateOne(
          { _id: userId },
          {
            $set: {
              wallet: walletAmount
            }
          }
        );
        for (let i = 0; i < products.length; i++) {
          let product = products[i];
          await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
            { _id: new objectId(product.item) },
            { $inc: { stock: product.quantity } }
          );
        }
      }
      resolve({return:true})
    });
  },  
  getOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: objectId(orderId) })
        .toArray();
      resolve(order);
    });
  },
  getOrdrStatistics: () => {
    return new Promise(async (resolve, reject) => {
      let ordrStatistics = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();
      resolve(ordrStatistics);
    });
  },
  getSaleStatistics: () => {
    return new Promise(async (resolve, reject) => {
      let saleStatistics = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              $expr: {
                $eq: [{ $year: "$date" }, 2023], // Replace 2023 with the desired year
              },
            },
          },
          {
            $group: {
              _id: { $month: "$date" }, // Group by month of the "date" field
              totalAmount: { $sum: "$totalAmount" }, // Calculate the sum of the "amount" field
            },
          },
          { $sort: { date: 1 } },
        ])
        .toArray();
      resolve(saleStatistics);
    });
  },
  getReport: (startDate, endDate) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              status: "Delivered",
              date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            },
          },
          {
            $sort: {
              date: -1,
            },
          }
        ]).toArray()
        resolve(orders);
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  },
  totalRev: async () => {
    let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match: {
          status: "Delivered"
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount"}
        }
      },
      {
        $project: {
          _id: 0,
          total: "$totalAmount"
        }
      }
    ]).toArray();
    return total
  }
};
