const express=require("express");
const user_route=express();
const userController =require("../controllers/userController");
const bodyparser=require("body-parser");
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

user_route.use(bodyparser.json());
user_route.use(bodyparser.urlencoded({extended:true}));

user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");


//landing-page
user_route.get("/",userController.loadHome);


//registeration
user_route.get("/register",userController.loadRegister);
user_route.post("/register",userController.insertUser);
//otp validation
user_route.post("/validate",userController.validateOtp)

//user_route.post("/login",userController.loadHome)
user_route.get("/validate",userController.loadHome);


//login 
user_route.get("/login",userController.loginLoad);
user_route.post("/login",userController.verifyLogin) 

//user-home
user_route.get("/userHome",auth.isLogin,userController.loadLogin);
//logout
user_route.get("/logout",auth.isLogin,userController.logOut)


//shop
user_route.get("/Shop",auth.isLogin,userController.shopLoad)
// user_route.get('/Shop', userController.products)
//products
user_route.get("/product-details",auth.isLogin,productController.productDetails)
//whishlist
user_route.get("/whishList",auth.isLogin,userController.whishList)
//cart 
// user_route.get("/cart",auth.isLogin,userController.cart)
user_route.get("/cart", auth.isLogin, cartController.getCartPage);
user_route.post("/addCart", auth.isLogin, cartController.addToCart)
user_route.post("/removeFromCart", cartController.deleteCart)
user_route.post("/change-quantity", cartController.changeQuantity)
//myProfile
user_route.get("/address", auth.isLogin, userController.profile)
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





module.exports=user_route;