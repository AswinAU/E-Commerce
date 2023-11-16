const user = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const otpGenerator = require("otp-generator");
const randomString = require("randomstring");
const session = require("express-session");
const productModel = require("../model/product-model");
const orderModel = require("../model/order-model");
const catMOdel = require("../model/category-model");
const coupounModel = require("../model/coupenModel");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const easyinvoice = require("easyinvoice");
const { Readable } = require("stream");

// load landing-page
const loadHome = async (req, res, next) => {
  try {
    res.render("landing-page", { log: req.session.isLoggedIn });
  } catch (err) {
    next(err);
  }
};

//load register
const loadRegister = async (req, res, next) => {
  try {
    // if (req.query.id) {
    //   req.session.referel = req.query.id;
    //   console.log(req.session.referel, "sessionnnnn");
    // }
    
    res.render("registration", { message: false });
  } catch (err) {
    next(err);
  }
};

//user registration
const objj = {};
const otppage = async (req, res) => {
  try {
    res.render("otp", { userId: req.query.id });
  } catch (error) {
    console.log(error.message);
  }
};

//user insertion 
const insertUser = async (req, res, next) => {
  try {
    const { name, email, password, repeatPassword, otp } = req.body;

    // Validate name (at least 3 characters)
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!name || name.trim().length < 1 || !name.match(nameRegex)) {
      return res.render("registration", {
        message: "Name is required and must contain only letters and spaces",
      });
    }

    // Validate email using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailRegex)) {
      return res.render("registration", { message: "Invalid email address" });
    }

    // Validate password (either all numbers or all letters, at least 8 characters)
    const passwordRegex = /^(?:\d+|[a-zA-Z]+){8,}$/;
    if (!password.match(passwordRegex)) {
      return res.render("registration", {
        message:
          "Password must be at least 8 characters long and consist of either all numbers or all letters",
      });
    }

    // Check if passwords match
    if (password !== repeatPassword) {
      return res.render("registration", { message: "Passwords didn't match" });
    }

    // Hash the password
    const spassword = await securePassword(password);

    // Create a new user
    const newUser = new user({
      name: name,
      email: email,
      otp: otp,
      password: spassword,
      repeatPassword: spassword,
      is_admin: 0,
    });
    
    // Save the user to the database
    const userData = await newUser.save();
    //generate otp and send verification mail
    if (userData) {
      const otp = randomString.generate({ length: 4, charset: "numeric" });
      objj.OTP = otp;
      console.log(objj.OTP);
      await sendVerifyMail(req.body.name, req.body.email, otp);
      res.redirect(`/otp?id=${userData._id} `);
    } else {
      res.render("registration", { message: "your registerarion Failed" });
    }

  } catch (err) {
    // Handle errors
    next(err);
  }
};

// passwordHashing
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// mail verification
const sendVerifyMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOption = {
      from: "aswinbrototype@gmail.com",
      to: email,
      subject: "For verification mail",
      html:
        "<p>Hyy " +
        name +
        " " +
        "this is your verify opt " +
        "  " +
        otp +
        ' "</p>',
    };
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email has been send :-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

//Resend otp
const resendOtp = async (req, res) => {
  try {
    const userId = req.query.userId.trim();
    const otp = randomString.generate({ length: 4, charset: "numeric" });
    objj.OTP = otp;
    console.log("recent", objj.OTP);
    await sendVerifyMail(req.body.name, req.body.email, otp);
    const userData = await user.findOne({ _id: userId });
    res.redirect(`otp?id=${userData._id}`);
  } catch (error) {
    console.log(error.message);
  }
};

//otp verification
const validateOtp = async (req, res) => {
  try {
    const formdata = req.body.otp1;
    const otp1 = req.body.otp1;
    const otp2 = req.body.otp2;
    const otp3 = req.body.otp3;
    const otp4 = req.body.otp4;
    const Newopt = otp1 + otp2 + otp3 + otp4;

    if (objj.OTP === Newopt) {
      delete objj.OTP;
      const id = req.body.userId.trim();

      const udpateinfo = await user.updateOne(
        { _id: id },
        { $set: { is_verified: 1 } }
      );

      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//load login-page
const loginLoad = async (req, res, next) => {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("login", { message: false });
    }
  } catch (err) {
    next(err);
  }
};

// login verification
const verifyLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Validate email using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailRegex)) {
      return res.render("login", { message: "Invalid email format" });
    }

    const passwordRegex = /^(?:\d+|[a-zA-Z]+){8,}$/;
    if (!password.match(passwordRegex)) {
      return res.render("login", { message: "Invalid password format" });
    }

    const userData = await user.findOne({ email: email, is_verified: 1 });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      // req.session.user = userData;
      // console.log(req.session.user);
      // if (req.session.referel) {
      //   const refererId = req.session.referel;
      //   const userId = req.session.user;
      //   const walletUpdateAmount = 200;
      //   const historyUpdateAmount = 200;

      //   // Update the referer's wallet and push a new history record
      //   await userModel.findByIdAndUpdate(
      //     refererId,
      //     {
      //       $push: {
      //         wallet: {
      //           amount: walletUpdateAmount,
      //           paymentType: "C",
      //           timestamp: Date.now(),
      //         },
      //         history: {
      //           amount: historyUpdateAmount,
      //           paymentType: "Credit",
      //           timestamp: Date.now(),
      //         },
      //       },
      //     },
      //     { new: true }
      //   );
      //   await userModel.findByIdAndUpdate(
      //     req.session.user,
      //     {
      //       $push: {
      //         wallet: {
      //           amount: walletUpdateAmount,
      //           paymentType: "C",
      //           timestamp: Date.now(),
      //         },
      //         history: {
      //           amount: historyUpdateAmount,
      //           paymentType: "Credit",
      //           timestamp: Date.now(),
      //         },
      //       },
      //     },
      //     { new: true }
      //   );
      // }

      if (passwordMatch) {
        req.session.user = userData._id;

        req.session.isLoggedIn = true;
        res.redirect("/userHome");
      } else {
        res.render("login", { message: "Email or password is incorrect" });
      }
    } else {
      res.render("login", { message: `Email or password is incorrect` });
    }
  } catch (err) {
    next(err);
  }
};

//load-userhome
const loadLogin = async (req, res, next) => {
  try {
    res.render("userHome", { log: req.session.isLoggedIn });
  } catch (err) {
    next(err);
  }
};

//user-logout
const logOut = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (err) {
    next(err);
  }
};

//shop load
const shopLoad = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) {
      res.redirect("/login");
    } else {
      await productModel
        .find()
        .lean()
        .then((data) => {
          const itemsperpage = 6;
          const currentpage = parseInt(req.query.page) || 1;
          const startindex = (currentpage - 1) * itemsperpage;
          const endindex = startindex + itemsperpage;
          const totalpages = Math.ceil(data.length / 6);
          const currentproduct = data.slice(startindex, endindex);
          res.render("Shop", {
            data,
            log: req.session.isLoggedIn,
            totalpages,
            currentpage,
            data: currentproduct,
          });
        });
    }
  } catch (err) {
    console.log(err);
  }
};

//myProfile
const profile = async (req, res, next) => {
  try {
    let userdata = await req.session.user;
    user.findById(userdata).then((data) => {
      res.render("myProfile", { data, userdata, log: req.session.isLoggedIn });
    });
  } catch (err) {
    next(err);
  }
};

//Address
const addressForm = async (req, res, next) => {
  try {
    await user.find({}).then((data) => {
      res.render("add-address", { data, log: req.session.isLoggedIn });
    });
  } catch (err) {
    next(err);
  }
};

//add-address
const confirmAddress = async (req, res, next) => {
  try {
    let id = req.session.user;

    await user.findByIdAndUpdate(
      { _id: id },
      {
        $push: {
          address: {
            _id: new mongoose.Types.ObjectId(),
            name: req.body.name,
            number: req.body.number,
            altNumber: req.body.altNumber,
            pinCode: req.body.pinCode,
            house: req.body.house,
            area: req.body.area,
            landmark: req.body.landmark,
            town: req.body.town,
            state: req.body.state,
          },
        },
      }
    );
    res.redirect("/address");
  } catch (err) {
    next(err);
  }
};

// editAddress
const editAddress = async (req, res, next) => {
  try {
    const ad = req.query.id;
    const login = req.session.user;
    const oid = new mongodb.ObjectId(login);
    const profile = await user.findById(login);
    const userAddress = profile.address.id(ad);

    res.render("editaddress", { userAddress, log: req.session.isLoggedIn });
  } catch (err) {
    next(err);
  }
};

//confirm-edit
const confirmEdit = async (req, res, next) => {
  try {
    const quer = req.query.id;
    let id = req.session.user;
    const User = await user.findById(id);
    const address = User.address.id(quer);
    address.set({
      name: req.body.name,
      number: req.body.number,
      altNumber: req.body.altNumber,
      pinCode: req.body.pinCode,
      house: req.body.house,
      area: req.body.area,
      landmark: req.body.landmark,
      town: req.body.town,
      state: req.body.state,
    });
    await User.save();

    res.redirect("/address");
  } catch (err) {
    next(err);
  }
};

// address deletion
const removeAddres = async (req, res, next) => {
  id = req.session.user;

  const profile = await user.findById(id);
  profile.address.pull(req.body.addressId);
  await profile.save();
  res.json({ status: true });
};

//products
const products = async (req, res, next) => {
  try {
    productModel.find({}).then((data) => {
      res.render("Shop", { data });
    });
  } catch (err) {
    next(err);
  }
};

// load checkout 
const checkout = async (req, res, next) => {
  try {
    const coupon = await coupounModel.find({
      minimumAmount: { $lte: req.body.total },
    });
    user.find({ _id: req.session.user }).then((data) => {
      res.render("checkOut1", {
        data: data,
        total: req.body.total,
        coupon,
        log: req.session.isLoggedIn,
      });
      console.log(data[0].cart[0],'datadatadatadata');
      
    });
  } catch (err) {
    next(err);
  }
};

// confirmation of order
const confirmation = async (req, res, next) => {
  try {
    const discount=req.body.discount;
    const status = req.body.payment;
    const userData = await user.findById(req.session.user);
    const items = [];

    let canPlaceOrder = true; // Initialize a flag to check if the order can be placed

    for (let i = 0; i < userData.cart.length; i++) {
      const product = await productModel.findById(userData.cart[i].productId);

      if (product) {
        if (product.quantity < 1) {
          canPlaceOrder = false; // Product quantity is below 1, cannot place the order
          console.error(`Product with ID ${product._id} has quantity below 1.`);
          break; // Exit the loop when a product quantity is below 1
        } else {
          const temp = {
            product: product._id,
            quantity: userData.cart[i].quantity,
            price: product.sale_price,
            discount
          };
          items.push(temp);

          const updatedDetails = await productModel.findByIdAndUpdate(
            temp.product,
            { $inc: { quantity: -parseInt(temp.quantity, 10) } },
            { new: true }
          );
        }
      } else {
        // Handle the case where the product doesn't exist
        console.error(
          `Product with ID ${userData.cart[i].productId} not found.`
        );
      }
    }

    if (!canPlaceOrder) {
      // Redirect back when a product quantity is below 1
      res.redirect("/checkOut1"); // Replace with your desired redirection path
      return; // Exit the function early
    }

    // let total = req.body.GrandTotal
    // console.log(total,'totaltotal');
    console.log(req.body,"BODY>>>>>>>>>>>>>>>>>>>>.");
    const order = await orderModel.create({
      user: req.session.user,
      items,
      orderStatus:"pending",
      totalAmount: '0',
      finalAmount: req.body.GrandTotal,
      paymentMode: status,
      address: userData.address[0],
      discount
      //discount: req.body.GrandTotal,
    });
    console.log(order,'orderCreated');

    if (order.paymentMode === "cod") {
      id = req.session.user;
      await user
        .findByIdAndUpdate(id, { $set: { cart: [] } })
        .then((data) => {
        })
        .catch((err) => {
        });

      res.json({ payment: true, method: "cod", order: order });
    } else if (order.paymentMode === "online") {
      const generatedOrder = await generateOrderRazorpay(
        order._id,
        req.body.GrandTotal
      );
      res.json({
        payment: true,
        method: "online",
        razorpayOrder: generatedOrder,
        order: order,
        //total: req.body.GrandTotal,
      });
    } else if (order.paymentMode === "wallet") {
      id = req.session.user;
      await user
        .findByIdAndUpdate(id, { $set: { cart: [] } })
        .then((data) => {
        })
        .catch((err) => {
        });

      await user
        .findByIdAndUpdate(id, {
          $push: {
            wallet: {
              amount: Number(-order.totalAmount),
              timestamp: Date.now(),
              paymentType: "D",
            },
          },
        })
        .then((data) => {
          console.log(data?.wallet);
        });

      res.json({ payment: true, method: "cod", order: order });
    }
  } catch (err) {
    next(err);
    res.status(500).send("Internal Server Error");
  }
};

//RazorPay 
const Razorpay = require("razorpay");
const { Transaction } = require("mongodb");
const userModel = require("../model/userModel");
const { log } = require("console");
//const { default: orders } = require("razorpay/dist/types/orders");
const instance = new Razorpay({
  key_id: "rzp_test_7dQjySZBDhgXXu",
  key_secret: "j6bRLlKZCjqKXeZ9iC1i2Iz8",
});

//generate razor-pay order
const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
    const options = {
      amount: total * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: String(orderId),
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log("Order Generated RazorPAY: " + JSON.stringify(order));
        resolve(order);
      }
    });
  });
};

//verify razor-pay payment
const verifyRazorpayPayment = (req, res, next) => {
  try {
    verifyOrderPayment(req.body)
      .then(async () => {
        id = req.session.user;
        await user
          .findByIdAndUpdate(id, { $set: { cart: [] } })
          .then((data) => {
          })
          .catch((err) => {
          });

        res.json({ status: true });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: "Payment failed!" });
      });
  } catch (err) {
    next(err);
    res.json({ status: false, errMsg: "Payment failed!" });
  }
};

//verify order
const verifyOrderPayment = (details) => {
  console.log("DETAILS : " + JSON.stringify(details));
  return new Promise((resolve, reject) => {
    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha256", "j6bRLlKZCjqKXeZ9iC1i2Iz8");
    hmac.update(
      details.payment.razorpay_order_id +
        "|" +
        details.payment.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    if (hmac == details.payment.razorpay_signature) {
      resolve();
    } else {
      reject();
    }
  });
};

//show-orders
const ShowOrders = async (req, res, next) => {
  try {
    const oid = new mongodb.ObjectId(req.query.id);
    const orders = await orderModel.aggregate([
      { $match: { user: oid } },
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
    ]);
    orders.reverse();
    const itemsperpage = 5;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / 5);
    const currentproduct = orders.slice(startindex, endindex);
    let userData = req.session.user;
    res.render("orderlist", {
      orders: currentproduct,
      totalpages,
      currentpage,
      userData,
      log: req.session.isLoggedIn,
    });
  } catch (err) {
    next(err);
    res.send("Error");
  }
};

//order-details
const orderDetails = async (req, res, next) => {
  try {
    const oid = new mongodb.ObjectId(req.query.id);

    const user = req.session.user;
    const orders = await orderModel.aggregate([
      { $match: { _id: oid } },
      { $unwind: "$items" },
      {
        $project: {
          proId: { $toObjectId: "$items.product" },
          quantity: "$items.quantity",
          address: "$address",
          items: "$items",
          finalAmount: "$finalAmount",
          createdAt: "$createdAt",
          discount: "$discount",
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
    ]);
    let userData = req.session.user;

    res.render("orderDetails", {
      order: orders,
      userData,
      log: req.session.isLoggedIn,
    });
  } catch (err) {
    next(err);
  }
};

//order status
// const changeStatus = (req, res, next) => {
//   try {
//     orderModel
//       .findByIdAndUpdate(req.body.orderId, { orderStatus: req.body.status })
//       .then((order) => {
//         console.log(req.body,'req.body.status');
//         console.log(req.body.status,'req.body.status');
//         addToWallet(req, res, order.totalAmount, "c");
//         console.log(order);
//         res.json(true);
//       })
//       .catch((err) => {
//         console.log(err);
//         res.json(false);
//       });
//   } catch (err) {
//     next(err);
//     res.json(false);
//   }
// };



const changeStatus = async (req, res, next) => {
  try {
    const orderId = req.body.orderId;
    const newStatus = req.body.status;

    // Find the order by ID
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json(false); // Order not found, return false
    }

    // Check if the order status is being changed to 'cancelled'
    if (order.orderStatus !== ' Order cancelled' && newStatus === ' Order cancelled') {
      // If the order is being cancelled, restore product quantities
      for (const item of order.items) {
        const product = await productModel.findById(item.product);
        if (product) {
          // Increment the product quantity by the quantity in the canceled order item
          product.quantity += item.quantity;
          await product.save();
        }
      }
    }

    // Update the order status in the database
    const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { orderStatus: newStatus });

    // Perform other logic here (addToWallet or any other operations)
    addToWallet(req, res, order.totalAmount, "c");

    console.log(updatedOrder);
    res.json(true);
  } catch (err) {
    console.log(err);
    res.json(false);
  }
};


//add to wallet
const addToWallet = async (req, res, amount, transactionType) => {
  let id = req.session.user;

  await user
    .findByIdAndUpdate(id, {
      $push: {
        wallet: { amount: Number(amount), paymentType: transactionType },
      },
    })
    .then((data) => {
      console.log(data?.wallet);
    });
};

//wallet
const wallet = (req, res, next) => {
  try {
    const userId = req.session.user;
    user.findById(userId).then((data) => {
      data.wallet.reverse();

      const itemsperpage = 5;
      const currentpage = parseInt(req.query.page) || 1;
      const startindex = (currentpage - 1) * itemsperpage;
      const endindex = startindex + itemsperpage;
      const totalpages = Math.ceil(data.wallet.length / 5);
      const currentproduct = data.wallet.slice(startindex, endindex);
      console.log("Current products : ", currentproduct);

      res.render("wallet", {
        log: req.session.isLoggedIn,
        data: currentproduct,
        totalpages,
        currentpage,
      });
    });
  } catch (err) {
    next(err);
  }
};

//category
const subCategory = async (req, res, next) => {
  const category = await catMOdel.find().lean();
  
  await productModel
    .find({ category: req.query.cat })
    .lean()
    .then((data) => {
      data.reverse();
      const itemsperpage = 5;
      const currentpage = parseInt(req.query.page) || 1;
      const startindex = (currentpage - 1) * itemsperpage;
      const endindex = startindex + itemsperpage;
      const totalpages = Math.ceil(data.length / 5);
      const currentproduct = data.slice(startindex, endindex);
      res.render("single-product", {
        log: req.session.isLoggedIn,
        data: data,
        subCategory: req.params.cat,
        cat: null,
        totalPages: false,
        totalpages,
        currentpage,
      });
    })
    .catch((err) => {
      next(err);
    });
};

//filer by price
const priceFilter = async (req, res, next) => {
  try {
    const priceRange = req.body.priceRange;
    const [minPrice, maxPrice] = priceRange.split("-").map(Number);

    const filteredProducts = await productModel
      .find({
        $and: [
          { sale_price: { $gte: minPrice } },
          { sale_price: { $lte: maxPrice } },
        ],
      })
      .lean();

    const itemsPerPage = 8;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / itemsPerPage);
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      data: currentProducts,
      totalProducts: totalProducts,
      totalPages: totalPages,
      currentPage: currentPage,
    });
  } catch (err) {
    next(err);
  }
};

//filter 
const filteredProducts = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) {
      res.redirect("/login");
    } else {
      // Retrieve the encoded data from the query parameter
      const encodedData = req.query.data;
      const currentPage = parseInt(req.query.page) || 1; // Get the current page from the query parameter

      if (encodedData) {
        // Decode the query parameter and parse it back to an object
        const filteredData = JSON.parse(decodeURIComponent(encodedData));

        // Implement pagination logic here based on currentPage and itemsPerPage
        const itemsPerPage = 6; // Number of items to display per page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalProducts = filteredData.length;
        const totalPages = Math.ceil(totalProducts / itemsPerPage);
        const currentProducts = filteredData.slice(startIndex, endIndex);

        // Pass the filtered data and pagination information to the view
        res.render("filtered-products", {
          log: req.session.isLoggedIn,
          data: currentProducts,
          currentpage: currentPage,
          totalpages: totalPages,
        });
      } else {
        // Handle case where there is no filtered data available
        res.render("filtered-products", {
          log: req.session.isLoggedIn,
          data: null,
          currentpage: null,
          totalpages: null,
        });
      }
    }
  } catch (err) {
    console.log(err);
    // Handle errors appropriately
  }
};

//search products by name
const searchProd = async (req, res, next) => {
  try {
    
    let data = await productModel.find({
      name: { $regex: `${req.body.search}`, $options: "i" },
    });
    res.render("Shop", { data, log: req.session.isLoggedIn });
  } catch (err) {
    next(err);
  }
};

//order success 
const orderSucceed = async (req, res, next) => {
  try {
    res.render("ordersucceed", { log: req.session.isLoggedIn });
  } catch (err) {
    next(err);
  }
};

//order failure
const orderFailure = async (req, res, next) => {
  try {
    res.render("orderFailure", { log: req.session.isLoggedIn });
  } catch (err) {
    next(err);
  }
};

// invoice
const downloadInvoice = async (req, res, next) => {
  try {
    const id = req.query.id;
    const userId = req.session.user._id;
    const result = await orderModel.findById(id);
    console.log(result,'result');
    //const product = await productModel.findById(result.items[0].product);
    //const product = result.items.map(item => item.product);

    const User = await user.findOne({ _id: userId });
    
    const order = {
      _id: id,
      totalAmount: result.finalAmount,
      date: result.createdAt, // Use the formatted date
      paymentMethod: result.paymentMode,
      orderStatus: result.orderStatus,
      discount: result.discount,
      name: result.address[0].name,
      number: result.address[0].number,
      pincode: result.address[0].pinCode,
      area: result.address[0].area,
      landmark: result.address[0].landmark,
      state: result.address[0].state,
      house: result.address[0].house,
      items: result.items,
    };

    console.log(order,'orderorderorder');
    
    //set up the product
    const products = await Promise.all(order.items.map(async (item) => {
      const product = await productModel.findById(item.product);
      return {
        quantity: parseInt(item.quantity),
        description: product.name,
        price: parseInt(product.sale_price),
        total: parseInt(item.price), // Assuming item.price is the total price for the current item
        "tax-rate": 0,
      };
    }));
    console.log(products,'productsproducts');
    const isoDateString = order.date;
    const isoDate = new Date(isoDateString);

    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = isoDate.toLocaleDateString("en-US", options);
    const data = {
      customize: {
        //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html
      },
      images: {
        // The invoice background
        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },
      // Your own data
      sender: {
        company: "Evara clothings",
        address: "Evara clothings Hub maradu",
        city: "Kochi",
        country: "India",
      },
      client: {
        company: "Customer Address",
        zip: order.pincode,
        city: order.area,
        address: order.name,
      },
      information: {
        // Invoice number
        number: "order:" + order._id,
        // ordered date
        date: formattedDate,
      },
      products: products,
      "bottom-notice": "Happy shoping and visit here again",
    };

    const pdfResult = await easyinvoice.createInvoice(data);
    const pdfBuffer = Buffer.from(pdfResult.pdf, "base64");

    // Set HTTP headers for the PDF response
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    // Create a readable stream from the PDF buffer and pipe it to the response
    const pdfStream = new Readable();
    pdfStream.push(pdfBuffer);
    pdfStream.push(null);

    pdfStream.pipe(res);
  } catch (err) {
    next(err);
    //   res.status(500).json({ error: error.message });
  }
};

module.exports = {
  loadRegister,
  insertUser,
  resendOtp,
  loginLoad,
  verifyLogin,
  sendVerifyMail,
  otppage,
  validateOtp,
  loadHome,
  logOut,
  shopLoad,
  loadLogin,
  products,
  checkout,
  profile,
  addressForm,
  confirmAddress,
  editAddress,
  confirmEdit,
  removeAddres,
  confirmation,
  ShowOrders,
  orderDetails,
  changeStatus,
  wallet,
  verifyRazorpayPayment,
  subCategory,
  priceFilter,
  filteredProducts,
  searchProd,
  orderSucceed,
  orderFailure,
  downloadInvoice,
};
