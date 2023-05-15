var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectID } = require("bson");
var objectId = require("mongodb").ObjectId;

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
      if (status === "placed") {
        let orders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "Delivered",
              },
            }
          )
          .then(() => {
            resolve({ shipped: true });
          });
      } else if (status === "Order Cancelling") {
        let orders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "Order Cancelled",
              },
            }
          )
          .then(() => {
            resolve({ cancel: true });
          });
      } else if (status === "Order Returning") {
        let orders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "Order Returned",
              },
            }
          )
          .then(() => {
            resolve({ return: true });
          });
      }
    });
  },
  getOrder: (orderId) => {
    console.log(orderId, ".........");
    return new Promise(async (resolve, reject) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ _id: objectId(orderId) })
        .toArray();
      console.log(order);
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
              //   ids: { $push: "$orderStatus" }
            },
          },
        ])
        .toArray();
      console.log(ordrStatistics, "iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
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
      console.log(saleStatistics, "iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
      resolve(saleStatistics);
    });
  },
};
