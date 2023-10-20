const express=require("express");
const user_route=express();
const userController =require("../controllers/userController");
const session=require("express-session");
const config=require('../config/config')
const path = require('path')
const auth=require("../middleware/auth")
const errorHandler = require("../middleware/errorhandler")
const userModel = require("../model/userModel");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");




user_route.use(express.static('public'))


user_route.use(session({secret:config.sessionSecret}));

user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");


//landing-page
user_route.get("/",userController.loadHome);


//registeration
user_route.get("/register",userController.loadRegister);
user_route.post("/register",userController.insertUser);
//otp validation
user_route.get('/otp',userController.otppage)
user_route.post("/validate",userController.validateOtp)
user_route.get("/recentopt",userController.recentOpt)

//user_route.post("/login",userController.loadHome)
user_route.get("/validate",userController.loadHome);


//login 
user_route.get("/login",userController.loginLoad);
user_route.post("/login",userController.verifyLogin) 

//user-home
user_route.get("/userHome",auth.isLogin,auth.checkBlocked,userController.loadLogin);
//logout
user_route.get("/logout",auth.isLogin,userController.logOut)


//shop
user_route.get("/Shop",auth.isLogin,auth.checkBlocked,userController.shopLoad)
// user_route.get('/Shop', userController.products)
//products
user_route.get("/product-details",auth.isLogin,productController.productDetails)
user_route.get("/filter", userController.subCategory)
user_route.post('/priceFilter',userController.priceFilter)
user_route.get("/filtered-products", userController.filteredProducts)
user_route.post("/search", userController.searchProd)

//whishlist
//user_route.get("/whishList",auth.isLogin,auth.checkBlocked,userController.whishList)
//cart 
// user_route.get("/cart",auth.isLogin,userController.cart)
user_route.get("/cart", auth.isLogin,auth.checkBlocked, cartController.getCartPage);
user_route.post("/addCart", auth.isLogin, cartController.addToCart)
user_route.get("/whishList", auth.isLogin,auth.checkBlocked, cartController.getwhishlistPage);
user_route.post("/addwhishlist", auth.isLogin, cartController.addTowhishlist)
user_route.post("/removeFromCart", cartController.deleteCart)
user_route.post("/removeFromwhishlist", cartController.deletewhishlist)
user_route.post("/change-quantity", cartController.changeQuantity)
//myProfile
user_route.get("/address", auth.isLogin, auth.checkBlocked,userController.profile)
user_route.get("/addAdress",auth.isLogin, userController.addressForm)
user_route.post("/addAdress", auth.isLogin,userController.confirmAddress)
user_route.get("/editAdress", userController.editAddress)
user_route.post("/editAdress", userController.confirmEdit)
user_route.post("/removeAdd", userController.removeAddres)
// user_route.get("/profileEdit",auth.isLogin,userController.editAddress)

//check-out
user_route.post("/check-out",auth.isLogin, userController.checkout)
//order
user_route.post("/confirmation", auth.isLogin, userController.confirmation)
user_route.get("/Account", auth.isLogin, userController.userProfile)
user_route.get("/orderlist", userController.ShowOrders)
user_route.get("/orderDetail", userController.orderDetails)
user_route.post("/change-order-status", userController.changeStatus)

//wallet
user_route.get("/wallet",auth.isLogin,userController.wallet)
user_route.post("/verifyPayment", userController.verifyRazorpayPayment)

user_route.post("/coupon", userController.checkCoupon)
user_route.get("/orderSucceed",userController.orderSucceed)
user_route.get("/orderFailure",userController.orderFailure)


user_route.use(errorHandler)

module.exports=user_route;