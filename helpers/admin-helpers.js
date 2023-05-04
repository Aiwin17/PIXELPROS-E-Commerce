var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt=require('bcrypt');
const { ObjectID } = require('bson');
var objectId = require('mongodb').ObjectId

module.exports={
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    getBlockUser:(id)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({_id: ObjectID(id)},
            {
                $set:{
                    blocked:true
                }
            }
            )
            resolve(true)
        })
    },
    getUnBlockUser:(id)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({_id: ObjectID(id)},
            {
                $set:{
                    blocked:false
                }
            }
            )
            resolve(true)
        })
    },
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders = db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    postUpdateOrders:(status,orderId)=>{
        return new Promise(async(resolve,reject)=>{
            if(status==='processing'){
            let orders = await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(orderId)},
            {
                $set:
                {
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve({shipped:true})
            })
        }else if(status==='Order Cancelling'){
            let orders = await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(orderId)},
            {
                $set:
                {
                    status:'Order Cancelled'
                }
            }
            ).then(()=>{
                resolve({cancel:true})
            })
        }else if(status==='Order Returning'){
            let orders = await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(orderId)},
            {
                $set:
                {
                    status:'Order Returned'
                }
            }
            ).then(()=>{
                resolve({return:true})
            })
        }
        })
    },
    getOrder:(orderId)=>{
        console.log(orderId,'.........');
        return new Promise(async(resolve,reject)=>{
            let order = await db.get().collection(collection.ORDER_COLLECTION).find({_id:objectId(orderId)}).toArray()
            console.log(order);    
            resolve(order)
            })
            }   
}