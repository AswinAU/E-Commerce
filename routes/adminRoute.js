const express = require("express");
const config = require("../config/config");
const session = require("express-session");
const adminController = require("../controllers/adminController");
const couponController = require("../controllers/couponController");
const auth = require("../middleware/adminAuth");
const valid = require("../middleware/imageValidation");
const categoryController = require("../controllers/categoryControler");
const categoryUpload = require("../multer/category-multer");
const productController = require("../controllers/productController");
const productUpload = require("../multer/product-upload");
const { route } = require("./userRoute");
const errorHandler = require("../middleware/errorhandler");

const admin_route = express();
admin_route.use(session({ secret: config.sessionSecret }));

admin_route.use(express.static("public"));

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

//load login
admin_route.get("/",  adminController.loadLogin);
admin_route.post("/",  adminController.verifyLogin);

//load dashboard
admin_route.get("/adminHome", auth.isLogin, adminController.loadDashboard);
admin_route.get("/logout", auth.isLogin, adminController.logout);

//product-categories
admin_route.get("/categories", auth.isLogin, categoryController.categories);
//add category
admin_route.get("/category", auth.isLogin, categoryController.category);
admin_route.post(
  "/add-category",
  categoryUpload.single("image"),
  valid,
  categoryController.addCategory
);
//delete
admin_route.get(
  "/delete-category/:id",
  auth.isLogin,
  categoryController.delete
);
//edit
admin_route.get(
  "/edit-C/:id",
  auth.isLogin,
  categoryController.editCategoryPage
);
admin_route.post(
  "/edit-C/:id",
  categoryUpload.single("image"),
  categoryController.updateCategory
);

admin_route.post("/searchCat", auth.isLogin, categoryController.categorySearch);

//route product
admin_route.get("/all-products", auth.isLogin, productController.allProduct);
admin_route.get("/add-product", auth.isLogin, productController.showAddProduct);
admin_route.post(
  "/add-product",
  productUpload.array("image", 4),
  auth.isLogin,
  productController.addProduct
);
//edit-product
admin_route.get("/edit/:id", auth.isLogin, productController.editProductPage);
admin_route.post(
  "/edit/:id",
  productUpload.array("image", 4),
  productController.editProduct
);
admin_route.get(
  "/delete-product/:id",
  auth.isLogin,
  productController.deleteProduct
);

//users list
admin_route.get("/userslist", auth.isLogin, adminController.userslist);
admin_route.post("/block-user", auth.isLogin, adminController.blockUser);
admin_route.post("/unblock-user", auth.isLogin, adminController.unblockUser);

//orders
admin_route.get("/order-list", auth.isLogin, adminController.ShowOrders);
admin_route.get("/order-detail/:id", auth.isLogin, adminController.orderDetail);
admin_route.post(
  "/change-order-status",
  auth.isLogin,
  adminController.changeStatus
);

//coupens
admin_route.get("/add-Coupon", auth.isLogin, couponController.loadCoupon);
admin_route.post("/addCoupon", auth.isLogin, couponController.addCoupon);
admin_route.get("/coupon", auth.isLogin, couponController.coupon);

admin_route.get("/deleteCoupon", auth.isLogin, couponController.deleteCoupon);
admin_route.get("/editCoupon", auth.isLogin, couponController.editCoupon);
admin_route.post("/updateCoupon", auth.isLogin, couponController.updateCoupon);

admin_route.get("/monthly-report", auth.isLogin,adminController.monthlyreport)
admin_route.get("/salesReport", auth.isLogin, adminController.SalesReoprt);
admin_route.get("/salesToday", auth.isLogin,adminController.salesToday)
admin_route.get("/salesWeekly", auth.isLogin,adminController.salesWeekly)
admin_route.get("/salesMonthly",auth.isLogin, adminController.salesMonthly)
admin_route.get("/salesYearly", auth.isLogin,adminController.salesYearly)

admin_route.use(errorHandler);
module.exports = admin_route;
