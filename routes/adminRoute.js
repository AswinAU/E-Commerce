const express = require("express");
const config = require("../config/config");
const session = require("express-session");
const bodyparser = require("body-parser");
const adminController = require("../controllers/adminController");
const auth = require("../middleware/adminAuth");
const valid = require('../middleware/imageValidation');
const categoryController = require("../controllers/categoryControler");
const categoryUpload = require("../multer/category-multer");
const productController = require("../controllers/productController");
const productUpload = require("../multer/product-upload");


const admin_route = express();
admin_route.use(session({ secret: config.sessionSecret }));

admin_route.use(express.static("public"));

admin_route.use(bodyparser.json());
admin_route.use(bodyparser.urlencoded({ extended: true }));

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

//load login
admin_route.get("/", auth.isLogOut,adminController.loadLogin);
admin_route.post("/", auth.isLogOut,adminController.verifyLogin);

//load dashboard
admin_route.get("/adminHome", auth.isLogin, adminController.loadDashboard);
admin_route.get("/logout", auth.isLogin, adminController.logout);

//product-categories
admin_route.get("/categories", auth.isLogin,categoryController.categories);
//add category
admin_route.get("/category", auth.isLogin,categoryController.category);
admin_route.post(
  "/add-category",
  categoryUpload.single("image"),valid,
  categoryController.addCategory
);
//delete
admin_route.get("/delete-category/:id", auth.isLogin,categoryController.delete);
//edit - not working
admin_route.get("/edit-C/:id", auth.isLogin,categoryController.editCategoryPage);
admin_route.post("/edit-C/:id",auth.isLogin, categoryController.editCategoryPage);
//search - not working
admin_route.post("/searchCat", auth.isLogin,categoryController.categorySearch);

//route product
admin_route.get("/all-products", auth.isLogin,productController.allProduct);
admin_route.get("/add-product", auth.isLogin,productController.showAddProduct);
admin_route.post(
  "/add-product",
  productUpload.array("image", 4),auth.isLogin,
  productController.addProduct
);
//edit-product
admin_route.get("/edit/:id",auth.isLogin, productController.editProductPage);
admin_route.post(
  "/edit/:id",
  productUpload.array("image", 4),
  productController.editProduct
);
admin_route.get("/delete-product/:id", auth.isLogin,productController.deleteProduct);

//users list
admin_route.get("/userslist", auth.isLogin,adminController.userslist);
admin_route.get("/block-user", auth.isLogin,adminController.blockUser);
admin_route.get("/unblock-user", auth.isLogin,adminController.unblockUser);

//orders
admin_route.get("/order-list", auth.isLogin,adminController.ShowOrders);
admin_route.get("/order-detail/:id", auth.isLogin,adminController.orderDetail)
admin_route.post("/change-order-status", auth.isLogin,adminController.changeStatus)

module.exports = admin_route;
