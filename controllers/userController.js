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
const coupounModel = require("../model/coupon");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
//const adminCategories=require("../view/admin/page-categories");

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

const recentOpt = async (req, res) => {
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
    console.log("sendemail");
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

//otp verification
const validateOtp = async (req, res) => {
  try {
    const formdata = req.body.otp1;
    console.log("Received form data:", formdata);
    const otp1 = req.body.otp1;
    const otp2 = req.body.otp2;
    const otp3 = req.body.otp3;
    const otp4 = req.body.otp4;
    const Newopt = otp1 + otp2 + otp3 + otp4;
    console.log("newOtp :-", Newopt);

    if (objj.OTP === Newopt) {
      delete objj.OTP;
      const id = req.body.userId.trim();

      const udpateinfo = await user.updateOne(
        { _id: id },
        { $set: { is_verified: 0 } }
      );

      res.redirect("userHome");
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

//load-login-userhome
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
      console.log("Enered");
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
          console.log(data);
          console.log(data.length);
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

//whishlist
// const whishList = async (req, res, next) => {
//   try {
//     res.render("whishList", { log: req.session.isLoggedIn });
//   } catch (err) {
//     next(err);
//   }
// };

// };

//myProfile
const profile = async (req, res, next) => {
  try {
    var userdata = await req.session.user;
    user.findById(userdata).then((data) => {
      res.render("myProfile", { data, userdata, log: req.session.isLoggedIn });
      console.log(data, "mmmmmmmmmmmmm");
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
    var id = req.session.user;
    console.log(id);
    console.log("hhhhhhhhhhhhhhhhhhhhh");

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

    console.log(ad, "lllllllllllllllll");
    const profile = await user.findById(login);
    console.log(profile, "prrrrrr");
    const userAddress = profile.address.id(ad);

    res.render("editaddress", { userAddress, log: req.session.isLoggedIn });
    console.log(userAddress, "adddddddd");
  } catch (err) {
    next(err);
  }
};

//confirm-edit
const confirmEdit = async (req, res, next) => {
  try {
    const quer = req.query.id;
    console.log(quer, "helllllllllllll");

    var id = req.session.user;
    console.log(id);
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
  console.log("hellllllllllllllll");
  id = req.session.user;
  console.log(id);

  const profile = await user.findById(id);
  profile.address.pull(req.body.addressId);
  await profile.save();
  res.json({ status: true });
};

//products
const products = async (req, res, next) => {
  try {
    productModel.find({}).then((data) => {
      console.log(data);
      res.render("Shop", { data });
    });
  } catch (err) {
    next(err);
  }
};

// checkout from cart

const checkout = async (req, res, next) => {
  try {
    const coupons = await coupounModel.find({
      minimumAmount: { $lte: req.body.total },
    });
    console.log(coupons);
    console.log(req.session.user, "oooo");
    user.find({ _id: req.session.user }).then((data) => {
      console.log(data, "dtaaa");
      res.render("checkOut1", {
        data: data,
        total: req.body.total,
        coupons,
        log: req.session.isLoggedIn,
      });
      console.log(data, "checkoutooooooooooooo");
    });
  } catch (err) {
    next(err);
  }
};

// confirmation of order

const confirmation = async (req, res, next) => {
  try {
    console.log(req.body);

    const status = req.body.payment;

    const userData = await user.findById(req.session.user);
    console.log(userData, "00000");
    const items = [];

    let canPlaceOrder = true; // Initialize a flag to check if the order can be placed

    for (let i = 0; i < userData.cart.length; i++) {
      const product = await productModel.findById(userData.cart[i].productId);

      if (product) {
        console.log(product, "producttttt");
        if (product.quantity < 1) {
          console.log(
            product.quantity,
            "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"
          );
          canPlaceOrder = false; // Product quantity is below 1, cannot place the order
          console.error(`Product with ID ${product._id} has quantity below 1.`);

          break; // Exit the loop when a product quantity is below 1
        } else {
          const temp = {
            product: product._id,
            quantity: userData.cart[i].quantity,
            price: product.sale_price,
          };
          items.push(temp);

          const updatedDetails = await productModel.findByIdAndUpdate(
            temp.product,
            { $inc: { quantity: -parseInt(temp.quantity, 10) } },
            { new: true }
          );

          console.log(updatedDetails, "Updated Product Details");
        }
      } else {
        // Handle the case where the product doesn't exist
        console.error(
          `Product with ID ${userData.cart[i].productId} not found.`
        );
      }
    }

    if (!canPlaceOrder) {
      console.log("chkk canPlaceOrder");
      // Redirect back when a product quantity is below 1
      res.redirect("/checkOut1"); // Replace with your desired redirection path
      return; // Exit the function early
    }

    const order = await orderModel.create({
      user: req.session.user,
      items,
      address: userData.address[0],
      paymentMode: status,
      discount: req.body.GrandTotal,
      totalAmount: 0,
      finalAmount: req.body.GrandTotal,
    });

    console.log(order, "Order Created");

    if (order.paymentMode === "cod") {
      console.log("COD: " + order.paymentMode);
      id = req.session.user;
      await user
        .findByIdAndUpdate(id, { $set: { cart: [] } })
        .then((data) => {
          console.log("cart deleted");
        })
        .catch((err) => {
          console.log("cart not deleted");
        });

      res.json({ payment: true, method: "cod", order: order });
    } else if (order.paymentMode === "online") {
      console.log("onlineeeeeeeeeeeeeeeeee");
      const generatedOrder = await generateOrderRazorpay(
        order._id,
        req.body.GrandTotal
      );
      res.json({
        payment: false,
        method: "online",
        razorpayOrder: generatedOrder,
        order: order,
        total: req.body.GrandTotal,
      });
    } else if (order.paymentMode === "wallet") {
      id = req.session.user;
      await user
        .findByIdAndUpdate(id, { $set: { cart: [] } })
        .then((data) => {
          console.log("cart deleted");
        })
        .catch((err) => {
          console.log("cart not deleted");
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

const Razorpay = require("razorpay");
const { Transaction } = require("mongodb");
const userModel = require("../model/userModel");
const { log } = require("console");
// const { default: items } = require("razorpay/dist/types/items");
const instance = new Razorpay({
  key_id: "rzp_test_7dQjySZBDhgXXu",
  key_secret: "j6bRLlKZCjqKXeZ9iC1i2Iz8",
});

const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
    console.log(total, "totallll");
    const options = {
      amount: total * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: String(orderId),
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.log("failed");
        console.log(err);
        reject(err);
      } else {
        console.log("Order Generated RazorPAY: " + JSON.stringify(order));
        resolve(order);
      }
    });
  });
};

const verifyRazorpayPayment = (req, res, next) => {
  try {
    verifyOrderPayment(req.body)
      .then(async () => {
        console.log("Payment SUCCESSFUL");
        id = req.session.user;
        await user
          .findByIdAndUpdate(id, { $set: { cart: [] } })
          .then((data) => {
            console.log("cart deleted");
          })
          .catch((err) => {
            console.log("cart not deleted");
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
      console.log("Verify SUCCESS");
      resolve();
    } else {
      console.log("Verify FAILED");
      reject();
    }
  });
};

const userProfile = async (req, res, next) => {
  try {
    var userdata = await req.session.user;
    user.findById(userdata).then((data) => {
      res.render("myProfile", { data, log: req.session.isLoggedIn, userdata });
      console.log(data, "mmmmmmmmmmmmm");
    });
  } catch (err) {
    next(err);
  }
};

const ShowOrders = async (req, res, next) => {
  try {
    console.log(req.query.id);
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
    console.log("Current products", currentproduct);
    res.render("orderlist", {
      orders: currentproduct,
      totalpages,
      currentpage,
      userData,
      log: req.session.isLoggedIn,
    });
    console.log(orders, "orrrrrrrrrrrr");
  } catch (err) {
    next(err);
    res.send("Error");
  }
};

const orderDetails = async (req, res, next) => {
  try {
    console.log(req.query.id);
    const oid = new mongodb.ObjectId(req.query.id);

    const user = req.session.user;
    console.log(user);
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
    console.log(orders, "orrrrrrrrrrrr");
  } catch (err) {
    next(err);
  }
};

//order status
const changeStatus = (req, res, next) => {
  try {
    orderModel
      .findByIdAndUpdate(req.body.orderId, { orderStatus: req.body.status })
      .then((order) => {
        addToWallet(req, res, order.totalAmount, "c");
        console.log(order);
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

const addToWallet = async (req, res, amount, transactionType) => {
  var id = req.session.user;
  console.log(id);

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
    console.log(userId);
    user.findById(userId).then((data) => {
      data.wallet.reverse();

      const itemsperpage = 5;
      const currentpage = parseInt(req.query.page) || 1;
      const startindex = (currentpage - 1) * itemsperpage;
      const endindex = startindex + itemsperpage;
      const totalpages = Math.ceil(data.wallet.length / 5);
      const currentproduct = data.wallet.slice(startindex, endindex);
      console.log("Current products : ", currentproduct);

      console.log(totalpages);
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

const checkCoupon = async (req, res, next) => {
  try {
    const discountValue = req.body.discount;
    console.log(req.body, "requestttt");

    const coupon = await coupounModel.find({
      code: discountValue.toLowerCase(),
    });
    console.log(coupon, "coouuppeennnn");
    res.json({ coupon });
  } catch (err) {
    next(err);
  }
};

//category
const subCategory = async (req, res, next) => {
  const category = await catMOdel.find().lean();
  console.log(req.query.cat);
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
    console.log(filteredProducts, "filteredProducts");

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


const searchProd = async (req, res, next) => {
  try {
    console.log(req.body.search,'testttttttttttttttt');
    let data = await productModel.find({
      name: { $regex: `${req.body.search}`, $options: "i" },
    });
    console.log(req.body.search,'testttttttttttttttt');
    console.log(data,'dattaaaaaaaaaaaa');
    res.render("Shop", { data,log: req.session.isLoggedIn, });
  } catch (err) {
    next(err);
  }
};


const orderSucceed = async(req,res, next)=>{
  try {
    res.render("ordersucceed", { log: req.session.isLoggedIn });
  } catch (err) {
    next(err)
  }
}


const orderFailure = async(req,res, next)=>{
  try {
    res.render("orderFailure", { log: req.session.isLoggedIn });
  } catch (err) {
    next(err)
  }
}






module.exports = {
  loadRegister,
  insertUser,
  recentOpt,
  loginLoad,
  verifyLogin,
  sendVerifyMail,
  otppage,
  validateOtp,
  loadHome,
  logOut,
  shopLoad,
  //whishList,
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
  userProfile,
  ShowOrders,
  orderDetails,
  changeStatus,
  wallet,
  verifyRazorpayPayment,
  checkCoupon,
  subCategory,
  priceFilter,
  filteredProducts,
  searchProd,
  orderSucceed,
  orderFailure
};
