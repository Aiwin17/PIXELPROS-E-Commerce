var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt=require('bcrypt');
const { ObjectID } = require('bson');
var objectId = require('mongodb').ObjectId
const twilio = require('../twilio')
module.exports={
    doSignup:(userData)=>{       
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(()=>{
            resolve(true)
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                if(status){
                    if (user.blocked) {
                        reject(true)
                        return;
                    }else{
                    response.user=user
                    db.get().collection(collection.USER_COLLECTION).updateOne({email:userData.email},
                        {
                            $set:{
                                Active:true
                            }
                        }
                        )
                    response.status=true
                    resolve(response)
                    }
                }else{
                    resolve({status:false})
                }
            })
            }else{
                resolve({status:false})
            }
        })
    },
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
    getUserDetails:(mobile_no)=>{
        return new Promise(async(resolve,reject)=>{
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({mobileno:mobile_no})
            if(user){
            if(user.blocked){
                reject(true)
                return
            }else{
                await twilio.sendOtp(mobile_no)
                resolve(true)
            }
        }else{
            resolve(false)
        }
        })
    },
    verifyOtp:(otp,mobileno)=>{
        console.log(otp,mobileno);
        otp=otp.join('')
        return new Promise(async(resolve,reject)=>{
            let result = await twilio.verifyOtp(mobileno,otp)
            console.log(result);
            if(result){
                let userData= await db.get().collection(collection.USER_COLLECTION).findOne({mobileno:mobileno})
                resolve({status:true,userData})
            }else{
                
                resolve(false)
            }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist = userCart.products.findIndex(product=>product.item==proId)
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId),"products.item":objectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId)},
                {
                    $push:{products:proObj}

                }).then((response)=>{
                    resolve()
                })
            }
            }else{
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(()=>{
                    resolve()
                })
            }            
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
          let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
              $match: { user: objectId(userId) }
            },
            {
              $unwind: '$products'
            },
            {
              $project: {
                item: '$products.item',
                quantity: '$products.quantity'
              }
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: 'item',
                foreignField: '_id',
                as:'products'
              }
            },

            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:["$products",0]}
                }
            }
          ]).toArray()
            resolve(cartItems);
        })
      },
    findUser:async (email)=>{
        const user = await db.get().collection(collection.USER_COLLECTION).findOne({email:email})
        return user
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let carts = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(carts){
                count=carts.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise(async(resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
               await db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                await db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }
                    ).then((response)=>{
                        resolve({status:true})
                    })
                }
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
              {
                $match: { user: objectId(userId) }
              },
              {
                $unwind: '$products'
              },
              {
                $project: {
                  item: '$products.item',
                  quantity: '$products.quantity'
                }
              },
              {
                $lookup: {
                  from: collection.PRODUCT_COLLECTION,
                  localField: 'item',
                  foreignField: '_id',
                  as:'products'
                }
              },
  
              {
                  $project:{
                      item:1,quantity:1,product:{$arrayElemAt:["$products",0]}
                  }
              },
              {
                $group:{
                    _id:null,
                    total:{$sum:{$multiply:['$quantity','$product.price']}}
                }
              }
            ]).toArray()
                resolve(total[0]?.total)                                                                                                                                                                                                                                                      
          })
    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'processing' : 'pending';
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    mobile: order.number,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date()
            };
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) });
                resolve(response);
            })
        });
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products)
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders= await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
              {
                $match: { _id: objectId(orderId) }
              },
              {
                $unwind: '$products'
              },
              {
                $project: {
                  item: '$products.item',
                  quantity: '$products.quantity'
                }
              },
              {
                $lookup: {
                  from: collection.PRODUCT_COLLECTION,
                  localField: 'item',
                  foreignField: '_id',
                  as:'products'
                }
              },
              {
                  $project:{
                      item:1,quantity:1,product:{$arrayElemAt:["$products",0]}
                  }
              }
            ]).toArray()
                resolve(orderItems)                                                                                                                                                                                                                                                      
          })
    },
    addAddress:(details)=>{
        return new Promise(async(resolve,reject)=>{
            let user = db.get().collection(collection.USER_COLLECTION).updateOne({_id: objectId(details.userId)},
            {
                $push:{address:details}

            }
            ).then((response)=>{
                resolve()
            })
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
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders = db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    postUpdateStatus:(orderId,status)=>{
        return new Promise(async(resolve,reject)=>{
            if(status==='processing'){
            let orders = db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(orderId)},
            {
                $set:
                {
                    status:'Order Cancelling'
                }
            }
            ).then((response)=>{
                resolve({status:true})
            })
        }else if(status==='placed'){
            let orders = db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(orderId)},
            {
                $set:
                {
                    status:'Order Returning'
                }
            }
            ).then((response)=>{
                resolve({status:true})
            })
        }
        })
    }   
}