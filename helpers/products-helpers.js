var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
const product = require('../config/collections')
module.exports = {
    addProduct: (product,image,callback) => {
        let imagesFiles =image.map(file=>file.filename)
        db.get().collection(collection.PRODUCT_COLLECTION).
            insertOne({
                name: product.productname,
                category: product.category,
                Brand: product.Brand,
                price:Number(product.price),
                description: product.description,
                image:imagesFiles
            }
            ).then((data) => {       
                callback(data.insertedId)
            })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find(( { Deleted: { $not: {$eq:true}  } } )).toArray()
            resolve(products)    
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
            resolve(product)
            })
        })
    },
        updateProduct:(prodId,proDetails,image)=>{
        let imagesFiles =image.map(file=>file.filename)
        if(imagesFiles.length===0){
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({_id:objectId(prodId)},{
                    $set:{
                        name:proDetails.productname,
                        // Brand:proDetails.Brand,
                        description:(proDetails.description).trim(),
                        price:proDetails.price,
                    }
                }).then((response)=>{
                    resolve(true)
                })
            })
        }else{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({_id:objectId(prodId)},{
                    $set:{
                        name:proDetails.productname,
                        // Brand:proDetails.Brand,
                        description:(proDetails.description).trim(),
                        price:proDetails.price,
                        image:imagesFiles
                    }
                }).then((response)=>{
                    resolve(true)
                })
            })
        }
       
    },
    getDelProducts:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(id)},
            {
                $set:{
                    Deleted:true
                }
            }
            )
            resolve(true)
        })
    },
   addCategories: (category) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: category }).then((data) => {
      if (data) {
        resolve({status:true});
      } else {
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne({ name: category }).then((data) => {
          resolve(data.insertedId);
        })
      }
    });
  });
},
    getAllCategories:()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();
                let cat = [];
                for (let category of categories) {
                  cat.push(category.name.category);
                }
                console.log(cat);
                resolve(cat);
              } catch (error) {
                reject(error);
              }
        })
    },
    getProducts:(proID)=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({_id:objectId(proID)}).toArray()
                resolve(products)
            })
    },
    addBanner:(banner,image)=>{
        return new Promise((resolve,reject)=>{
            let imagesFiles = image.map(file=>file.filename)
            db.get().collection(collection.BANNER_COLLECTION).
            insertOne(
                {
                name:banner.bannername,
                image:imagesFiles
            }
            ).then((data)=>{
                resolve(data.insertedId)
            })
        })
    },
    getBanner:()=>{
        return new Promise((resolve,reject)=>{
            let banner = db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },
    editBanner:(banId,banDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANNER_COLLECTION).updateOne({_id:objectId(banId)},
            {
                $set:{
                    name:banDetails.bannername   
                }
            }
            ).then(()=>{
                resolve(true)
            })
        })
    }
}