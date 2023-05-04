const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/products-helpers')
var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('express')
module.exports = {
    middleware:async(req,res,next)=>{
        let category=await productHelpers.getAllCategories()
        res.locals.category=category
        next()
    },
    getHome: async (req,res) => {
        let user = req.session.user
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        let banner=await productHelpers.getBanner()
        let products=await productHelpers.getAllProducts()
        res.render('user/index', { products,user,cartCount,banner})
    },
    getLogin: async (req, res) => {
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        res.render('user/user-login', { user:false,cartCount})
    },
    postLogin: (req, res) => {
        userHelpers.doLogin(req.body).then(async (response) => {
            if (response.status) {
                const email = req.body.email
                const userData = await userHelpers.findUser(email)
                req.session.userId = userData._id
                req.session.loggedIn = true
                req.session.user = response.user
                res.redirect('/')
            } else {
                res.redirect('/login')
            }
        }).catch(() => {
            res.redirect('/login')
        })
    },
    getLogout: (req, res) => {
        let userData = req.session.user
        db.get().collection(collection.USER_COLLECTION).updateOne({ email: userData.email },
            {
                $set: {
                    Active: false
                }
            }
        )
        req.session.loggedIn = false
        req.session.user = false
        res.redirect('/')
    },
    getSignUp: async(req, res) => {
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        res.render('user/user-signup', { user: false,cartCount})
    },
    postSignUp: (req, res) => {
        userHelpers.doSignup(req.body).then(() => {
            res.redirect('/login')
        })
    },
    getProducts: async(req, res) => {
        let id = req.query.id
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        productHelpers.getProducts(id).then((products) => {
            res.render('user/userproduct-list', { cartCount,products, user: req.session.user })
        })
    },
    getOtpLogin: async(req, res) => {
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        res.render('user/otp-Login', { user: req.session.user , cartCount})
    },
    postOtpLogin: (req, res) => {
        let mobile_no = req.body.mobile_no
        userHelpers.getUserDetails(mobile_no).then(() => {
            res.render('user/verify-otp', { mobile_no })
        })
    },
    getVerifyOtp: async(req, res) => {
        res.render('user/verify-otp', { user: false  })
    },
    postVerifyOtp: (req, res) => {
        let mobileno = req.body.mobileNo
        let otp = req.body.number
        userHelpers.verifyOtp(otp,mobileno).then(response=>{
            if(response.status){
                req.session.user = response.userData
                req.session.loggedIn = true
                res.redirect('/')
            }else{
                let mobile_no =mobileno
                res.render('user/verify-otp', { mobile_no })
            }
        })
    },
    getCart: (async (req, res) => {
            let cartCount = await userHelpers.getCartCount(req.session.userId)
            let products = await userHelpers.getCartProducts(req.session.userId)
            let total = await userHelpers.getTotalAmount(req.session.userId)
            if(total){
                res.render('user/addtocart', { user: req.session.user, products,cartCount, total})

            }else{
                res.render('user/empty-cart', { user: req.session.user, products,cartCount,total:0})
   
            }
    }),
    getaddToCart: (req, res) => {
            userHelpers.addToCart(req.query.id, req.session.userId).then(async() => {
                let cartCount = await userHelpers.getCartCount(req.session.userId)
                res.json({ status: true,cartCount })
            })

    },
    postProQuantity: (req,res) => {
        userHelpers.changeProductQuantity(req.body).then(async(response) => { 
             response.total=await userHelpers.getTotalAmount(req.body.user)
                res.json(response)
        })
    },
    getPlaceOrder: async (req, res) => {
            let cartCount = await userHelpers.getCartCount(req.session.userId)
            userHelpers.getTotalAmount(req.session.userId).then((Total) => {
                res.render('user/place-order', { user: req.session.user, cartCount, Total })
            }).catch((err) => {
                console.log(err);
                res.status(500).send('Internal Server Error');
            });
        
    },
     postPlaceOrder:async (req,res)=>{
        let coupon = req.body.coupon
        let products=await userHelpers.getCartProductList(req.body.userId)
        let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
        if(coupon){
            let cpn = await productHelpers.getAllCoupons(coupon)
            let discount = parseInt(cpn[0].max_discount)
            total = totalPrice-discount
        }else{
            total = totalPrice
        }
        userHelpers.placeOrder(req.body,products,totalPrice,req.session.userId).then((orderId)=>{
            console.log(orderId);
            if(req.body['payment-method']=='COD'){
            res.json({codSuccess:true})
            }else{
                console.log(total);
                userHelpers.generateRazorpay(orderId,total).then((response)=>{
                    res.json(response)
                })
            }
        })
    },
    getOrderSuccess:async (req,res)=>{
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        res.render('user/order-success',{user:req.session.user,cartCount})
    },
    getOrders:async(req,res)=>{
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        let orders = await userHelpers.getUserOrders(req.session.userId)
        res.render('user/orders',{user:req.session.user,orders,cartCount})
    },
    getViewOrders:async(req,res)=>{
        
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        let products=await userHelpers.getOrderProducts(req.query.id)
        res.render('user/view-orders',{user:req.session.user,products,cartCount})
             
    },
    getAllProducts:async(req,res)=>{
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        productHelpers.getAllProducts().then((product) => {
         res.render('user/userproduct-list',{cartCount,product})
        }) 
    },
    getProductList:async(req,res)=>{
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        productHelpers.getAllProducts().then((product) => {
         res.render('user/category',{user:req.session.user,cartCount,product})
        }) 
    },
    getAddress:async(req,res)=>{
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        res.render('user/address',{user:req.session.user,cartCount})
    },
    postAddress:async(req,res)=>{
        console.log(req.body);
        let address = await userHelpers.addAddress(req.body)
        res.redirect('/address')
    },
    postOrderStatus:async(req,res)=>{
        let orderId = req.body.orderId
        let status = req.body.status
        await userHelpers.postUpdateStatus(orderId,status).then((response)=>{
            res.json(response)
        })
    },
    postCategoryProducts:(req,res)=>{
        userHelpers.postCategoryProducts(req.body).then((products)=>{
            res.json(products)
        })
    },
    getUserAddress:async(req,res)=>{
        let userId = req.session.userId
        console.log(userId,"///////////////////////////////");
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        await userHelpers.getUsers(userId).then((user)=>{
            console.log(user,".......................................");
        res.render('user/user-address',{user,cartCount})
        })
    },
    getUserProfile:async(req,res)=>{
        let userId = req.session.userId
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        await userHelpers.getUsers(userId).then((user)=>{
            res.render('user/user-profile',{user,cartCount})
        })
    },
    
    getCategoryLists:async(req,res)=>{
        let user =req.session.user
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        userHelpers.getCategoryList(req.query.id).then((products)=>{
            let cat=products[0].categoryDocs
            console.log(cat);
            res.render('user/category-list',{user,cartCount,cat})
        })
    },
    postRemoveCart:async(req,res)=>{
        // console.log(req.body.cart);
        userHelpers.removeCart(req.body).then((response)=>{
            res.json(response)
        })
    },
    getEditAddress:async(req,res)=>{
        let user = req.session.user
        const address = user.address.find((item) => {
            return item._id == req.params.id;
        });
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        res.render('user/edit-address',{user,cartCount,address})
    },
    getEditProfile:async(req,res)=>{
        let userId = req.session.userId
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        await userHelpers.getUsers(userId).then((user)=>{
            res.render('user/edit-profile',{user,cartCount})
        })
    },
    postEditAddress:async(req,res)=>{
        let addressId = req.params.id
        await userHelpers.editAddress(req.body,addressId).then(()=>{
            res.redirect('/user-address/:id')
        })
    },
    postEditProfile:async(req,res)=>{
        userHelpers.editUserProfile(req.body.userId,req.body).then(()=>{
            res.redirect('/user-profile')
        })
    },
    getUserCoupons:async(req,res)=>{
        let user = req.session.user
        await userHelpers.getAllCoupon().then(async(coupons)=>{
            let cartCount = await userHelpers.getCartCount(req.session.userId)
            res.render('user/user-coupons',{cartCount,user,coupons})
        })
    },
    postVerifyPayment:(req,res)=>{
        console.log(req.body);
        userHelpers.verifyPayment(req.body).then(()=>{
            userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
                res.json({status:true})
            })
        }).catch((err)=>{
            res.json({status:false})
        })
    },
    postApplyCoupon:async(req,res)=>{
        console.log(req.body);
        await userHelpers.applyCoupon(req.body.couponCode,req.body.userId).then((response)=>{
            console.log(response);
            if(response.status){
                console.log(response);
                let total=req.body.total-response.discount
                res.json({total,discount:response.discount})
            }else{
                console.log("invalid coupon")
                res.json({status:false})
            }
        })
    },
    getOtpChangePassword:async(req,res)=>{
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        res.render('user/otp-changePassword', { user: req.session.user , cartCount})
    },
    postOtpChangePassword:async(req,res)=>{
        let mobile_no = req.body.mobile_no
        userHelpers.getUserDetails(mobile_no).then(() => {
            res.render('user/verify-otp-password', { mobile_no })
        })
    },
    postVerifyOtpChangePassword:async(req,res)=>{
        let mobileno = req.body.mobileNo
        let otp = req.body.number
        userHelpers.verifyOtp(otp, mobileno).then(response=>{
            if(response.status){
                res.render('user/forgot-password',{mobileno})
            }else{
                let mobile_no =mobileno
                res.render('user/verify-otp-password',{ mobile_no })
            }
        })
    },
    postUpdatePassword:async(req,res)=>{
        console.log(req.body);
        await userHelpers.updatePassword(req.body.confirmPassword,req.body.mobileno).then(()=>{
            res.redirect('/login')
        })
    },
    getViewDetails:async(req,res)=>{
        let user = req.session.user
        let id = req.query.id
        let cartCount = await userHelpers.getCartCount(req.session.userId)
        await userHelpers.getOrderProducts(id).then((orderDetails)=>{
            res.render('user/view-details',{user,cartCount,orderDetails})
        })
    }
}
