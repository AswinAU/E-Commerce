const user = require("../model/userModel");
const bcrypt = require("bcrypt");
const categoryModel = require("../model/category-model");
const productModel = require("../model/product-model");
const orderModel = require("../model/order-model");
const couponModel = require("../model/coupenModel");
const mongodb = require("mongodb");
const moment = require("moment")

//login page
const loadLogin = async (req, res, next) => {
  try {
    res.render("adminLogin", { message: false });
  } catch (err) {
    next(err);
  }
};

// login verification
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
    const currentPage = '/admin/adminHome';
    res.render("adminHome",{currentPage}); // Updated argument names
  } catch (err) {
    next(err);
  }
};

// logout
const logout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
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
      const currentPage = '/admin/userslist'

      res.render("page-sellers-list", {
          users,
          currentPage: page,
          currentPage,
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
    const currentPage = '/admin/order-list';
    const totalPages = Math.ceil(count / itemsperpage);
    res.render("orders-list", { orders, totalPages, page , currentPage });
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
    const productName = order.items[0].product.name;

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

const monthlyreport = async (req, res) => {
  try {
    console.log('enteredd');
    const start = moment().subtract(30, "days").startOf("day"); // Data for the last 30 days
    const end = moment().endOf("day");

    const orderSuccessDetails = await orderModel.find({
      createdAt: { $gte: start, $lte: end },
      orderStatus: "Delivered",
    });
    console.log(orderSuccessDetails,'orderSuccessDetails');
    
    const monthlySales = {};

    orderSuccessDetails.forEach((order) => {
      const monthName = moment(order.order_date).format("MMMM");
      if (!monthlySales[monthName]) {
        monthlySales[monthName] = {
          revenue: 0,
          productCount: 0,
          orderCount: 0,
          codCount: 0,
          razorpayCount: 0,
        };
      }
      
      monthlySales[monthName].revenue += order.finalAmount;
      monthlySales[monthName].productCount += order.items.length;
      monthlySales[monthName].orderCount++;

      if (order.payment === "cod") {
        monthlySales[monthName].codCount++;
      } else if (order.payment === "Razorpay") {
        monthlySales[monthName].razorpayCount++;
      }
    });

    const monthlyData = {
      labels: [],
      revenueData: [],
      productCountData: [],
      orderCountData: [],
      codCountData: [],
      razorpayCountData: [],
    };

    for (const monthName in monthlySales) {
      if (monthlySales.hasOwnProperty(monthName)) {
        monthlyData.labels.push(monthName);
        monthlyData.revenueData.push(monthlySales[monthName].revenue);
        monthlyData.productCountData.push(monthlySales[monthName].productCount);
        monthlyData.orderCountData.push(monthlySales[monthName].orderCount);
        monthlyData.codCountData.push(monthlySales[monthName].codCount);
        monthlyData.razorpayCountData.push(
          monthlySales[monthName].razorpayCount
        );
      }
    }
    console.log(monthlyData,'monthlyData');
    return res.json(monthlyData);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        message: "An error occurred while generating the monthly report.",
      });
  }
};

const SalesReoprt = (req, res) => {
  console.log(req.query.day);
  if (req.query.day) {
    res.redirect(`/admin/${req.query.day}`);
  } else {
    res.redirect(`/admin/salesToday`);
  }
};

const salesToday = async (req, res) => {
  let todaysales = new Date();
  const startOfDay = new Date(
    todaysales.getFullYear(),
    todaysales.getMonth(),
    todaysales.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfDay = new Date(
    todaysales.getFullYear(),
    todaysales.getMonth(),
    todaysales.getDate(),
    23,
    59,
    59,
    999
  );

  try {
    const orders = await orderModel
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
            orderStatus: "Delivered",
          },
        },
      ])
      .sort({ createdAt: -1 });
    // const productIds = orders.map((order) => order.product.productId);
    // const products = await product.find({
    //   _id: { $in: productIds },
    // });
    console.log(orders);
    const itemsperpage = 3;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / 3);
    const currentproduct = orders.slice(startindex, endindex);
    const currentPage = '/admin/salesToday';
    res.render("salesReport", {
      order: currentproduct,
      currentpage,
      totalpages,
      currentPage,
      //product: products,
      salesToday: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const salesWeekly = async (req, res) => {
  const currentDate = new Date();

  const startOfWeek = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() - currentDate.getDay()
  );
  const endOfWeek = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate() + (6 - currentDate.getDay()),
    23,
    59,
    59,
    999
  );

  console.log(currentDate < endOfWeek);
  console.log(endOfWeek);
  const orders = await orderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfWeek,
          $lt: endOfWeek,
        },
        orderStatus: "Delivered",
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  currentPage = '/admin/salesWeekly'
  const itemsperpage = 3;
  const currentpage = parseInt(req.query.page) || 1;
  const startindex = (currentpage - 1) * itemsperpage;
  const endindex = startindex + itemsperpage;
  const totalpages = Math.ceil(orders.length / 5);
  const currentproduct = orders.slice(startindex, endindex);
  res.render("salesReport", {
    order: currentproduct,
    salesWeekly: true,
    totalpages,
    currentpage,
    currentPage,
  });
};

const salesMonthly = async (req, res) => {
  const thisMonth = new Date().getMonth() + 1;
  const startofMonth = new Date(
    new Date().getFullYear(),
    thisMonth - 1,
    1,
    0,
    0,
    0,
    0
  );
  const endofMonth = new Date(
    new Date().getFullYear(),
    thisMonth,
    0,
    23,
    59,
    59,
    999
  );

  try {
    const orders = await orderModel
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: startofMonth,
              $lt: endofMonth,
            },
            orderStatus: "Delivered",
          },
        },
      ])
      .sort({ createdAt: -1 });
    // const productIds = orders.map((order) => order.product.productId);
    // const products = await product.find({
    //   _id: { $in: productIds },
    // });
    const itemsperpage = 3;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / 3);
    const currentproduct = orders.slice(startindex, endindex);
    currentPage = '/admin/salesMonthly'
    res.render("salesReport", {
      order: currentproduct,
      totalpages,
      currentpage,
      currentPage,
      salesMonthly: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const salesYearly = async (req, res) => {
  const today = new Date().getFullYear();
  const startofYear = new Date(today, 0, 1, 0, 0, 0, 0);
  const endofYear = new Date(today, 11, 31, 23, 59, 59, 999);

  try {
    const orders = await orderModel
      .aggregate([
        {
          $match: {
            createdAt: {
              $gte: startofYear,
              $lt: endofYear,
            },
            orderStatus: "Delivered",
          },
        },
      ])
      .sort({ createdAt: -1 });
    console.log(orders, "ods");
    // const products = await product.find({
    //   _id: { $in: productIds },
    // });
    const itemsperpage = 5;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / 5);
    const currentproduct = orders.slice(startindex, endindex);
    currentPage = '/admin/salesYearly'
    res.render("salesReport", {
      order: currentproduct,
      totalpages,
      currentpage,
      currentPage,
      // product: products,
      salesYearly: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


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
  monthlyreport,
  SalesReoprt,
  salesToday,
  salesWeekly,
  salesMonthly,
  salesYearly,

};
