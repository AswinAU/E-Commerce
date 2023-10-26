const user = require("../model/userModel");
const bcrypt = require("bcrypt");
const categoryModel = require("../model/category-model");
const productModel = require("../model/product-model");
const orderModel = require("../model/order-model");
const couponModel = require("../model/coupenModel");
const mongodb = require("mongodb");

//login page
const loadLogin = async (req, res, next) => {
  try {
    res.render("adminLogin", { message: false });
  } catch (err) {
    next(err);
  }
};

// login verification
// const verifyLogin = async (req, res, next) => {
//   try {
//     const email = req.body.email;
//     const password = req.body.password;
//     const userData = await user.findOne({ email: email, is_admin: 1 });
//     console.log(userData);
//     if (userData) {
//       const passwordMatch = await bcrypt.compare(password, userData.password);

//       if (passwordMatch) {
//         if (userData.is_admin == 0) {
//           res.render("adminLogin", {
//             message: "email and password is incorrect",
//           });
//         } else {
//           req.session.user_id = userData._id;
//           res.redirect("/admin/adminHome");
//         }
//       } else {
//         res.render("adminLogin", {
//           message: "email and password is incorrect",
//         });
//       }
//     } else {
//       res.render("adminLogin", { message: "email and password is incorrect" });
//     }
//   } catch (err) {
//     next(err);
//   }
// };
const verifyLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await user.findOne({ email: email, is_admin: 1 });

    if (userData) {
      // Validate password (either all numbers or all letters, at least 8 characters)
      const passwordRegex = /^(?:\d+|[a-zA-Z]+){8,}$/;
      if (!password.match(passwordRegex)) {
        return res.render("adminLogin", { message: "Invalid password format" });
      }

      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin == 0) {
          res.render("adminLogin", {
            message: "Email and password are incorrect",
          });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/admin/adminHome");
        }
      } else {
        res.render("adminLogin", {
          message: "Email and password are incorrect",
        });
      }
    } else {
      res.render("adminLogin", { message: "Email and password are incorrect" });
    }
  } catch (err) {
    next(err);
  }
};


// Dashboard load
const loadDashboard = async (req, res, next) => {
  try {
    const userData = await user.findById({ _id: req.session.user_id });
    const users = await user.find({ is_admin: 0 });
    res.render("adminHome"); // Updated argument names
  } catch (err) {
    next(err);
  }
};

// logout
const logout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/adminLogin");
  } catch (error) {
    next(err);
  }
};

// user-list
const userslist = async (req, res, next) => {
  try {
      const page = req.query.page || 1;
      const limit = 5; // Number of users per page
      const skip = (page - 1) * limit;

      const users = await user.find({ is_admin: 0 }).skip(skip).limit(limit);
      const totalUsers = await user.countDocuments({ is_admin: 0 });

      res.render("page-sellers-list", {
          users,
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit)
      });
  } catch (err) {
      next(err);
  }
};


//block-user
const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.body; // Extract userId from request body
    console.log(userId, 'User ID');
    
    // Assuming `user` is your Mongoose model, make sure to pass `userId` as an ObjectId
    // Update the user's verification status in the database
    await user.findByIdAndUpdate(userId, { is_verified: 0 });
    
    res.status(200).send('User blocked successfully'); // Send a success response back to the client
  } catch (err) {
    console.error('Error blocking user:', err);
    res.status(500).send('Internal Server Error'); // Send an error response back to the client
  }
};


// unblock-user
const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.body; // Extract userId from request body
    console.log(userId, 'User ID');

    // Assuming `user` is your Mongoose model, make sure to pass `id` as an ObjectId
    // Update the user's verification status in the database
    await user.findByIdAndUpdate(userId, { is_verified: 1 });

    res.status(200).send('User unblocked successfully'); // Send a success response back to the client
  } catch (err) {
    console.error('Error unblocking user:', err);
    res.status(500).send('Internal Server Error'); // Send an error response back to the client
  }
};



// orders listing in admin side

const ShowOrders = async (req, res, next) => {
  try {
    let doc = await orderModel.aggregate([
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1,
          },
        },
      },
    ]);
    const itemsperpage = 7;
    const count = doc[0].total;

    const page = req.query.page || 1;

    let orders = await orderModel.aggregate([
      { $unwind: "$items" },
      {
        $project: {
          proId: { $toObjectId: "$items.product" },
          quantity: "$items.quantity",
          address: "$address",
          items: "$items",
          finalAmount: "$finalAmount",
          createdAt: "$createdAt",
          orderStatus: "$orderStatus",
          paymentMode: "$paymentMode",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "proId",
          foreignField: "_id",
          as: "ProductDetails",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: itemsperpage * (page - 1) },
      { $limit: itemsperpage },
    ]);

    const totalPages = Math.ceil(count / itemsperpage);
    res.render("orders-list", { orders, totalPages, page });
  } catch (err) {
    next(err);
    res.send("Error");
  }
};


const orderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel
      .findById(orderId)
      .lean()
      .populate("items.product", "name price"); // Assuming 'items.product' is the reference to the 'Product' model
    console.log("this is poducts ", order.items);
    const productName = order.items[0].product.name;
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", productName);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("page-orders-detail", {
      data: order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};


const changeStatus = (req, res, next) => {
  try {
    orderModel
      .findByIdAndUpdate(req.body.orderId, { orderStatus: req.body.status })
      .then((status) => {
        console.log(status);
        res.json(true);
      })
      .catch((err) => {
        console.log(err);
        res.json(false);
      });
  } catch (err) {
    next(err);
    res.json(false);
  }
};

//coupen
// const addcoupon = async (req, res, next) => {
//   console.log(req.body);
//   try {
//     couponModel.find({}).then((data) => {
//       data.reverse();
//       const itemsperpage = 3;
//       const currentpage = parseInt(req.query.page) || 1;
//       const startindex = (currentpage - 1) * itemsperpage;
//       const endindex = startindex + itemsperpage;
//       const totalpages = Math.ceil(data.length / 3);
//       const currentproduct = data.slice(startindex, endindex);
//       res.render("addcoupon", {
//         data: currentproduct,
//         totalpages,
//         currentpage,
//       });
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// const addcouponpost = async (req, res, next) => {
//   console.log("kkkkkkkkkkkkkkkkkkkkkkkkkk");
//   try {
//     console.log(req.body);
//     let coupon = req.body;
//     await couponModel.create(coupon);
//     res.redirect("back");
//   } catch (err) {
//     next(err);
//   }
// };

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  blockUser,
  unblockUser,
  userslist,
  ShowOrders,
  orderDetail,
  changeStatus,
  //addcoupon,
  //addcouponpost,
};
