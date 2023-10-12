const user = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const otpGenerator = require("otp-generator");
const session = require("express-session");
const productModel = require("../model/product-model");
const orderModel = require("../model/order-model");
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
const insertUser = async (req, res, next) => {
  console.log(req.body);

  try {
    if (req.body.password === req.body.repeatPassword) {
      const spassword = await securePassword(req.body.password);
      const newUser = new user({
        name: req.body.name,
        email: req.body.email,
        otp: req.body.otp,
        password: spassword,
        repeatPassword: spassword,
        is_admin: 0,
      });
      const userData = await newUser.save();
      if (userData) {
        req.session.otp = await sendVerifyMail(
          req.body.name,
          req.body.email,
          userData._id
        );

        res.render("otp", {
          message: "check your mail for otp and veriy",
        });
      } else {
        res.render("registration", { message: "your registration is failed " });
      }
    } else {
      res.render("registration", { message: "passwords didn't match" });
    }
  } catch (err) {
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
const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTls: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });

    let otp = generateOtp();
    otp = otp.toLowerCase();
    //req.session.otp=otp;
    const mailOptions = {
      from: "aswinbrototype@gmail.com",
      to: email,
      subject: "otp for verification",
      html: `<p> Hi ${name},your otp is ${otp}"verify</a> your mail</p>`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log("email has been sent:", info.response);
        console.log(otp);
      }
    });

    return otp;
  } catch (err) {
    console.log(err);
  }
};

//generate otp
const generateOtp = () => {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};

//otp validation
const validateOtp = async (req, res, next) => {
  try {
    otp = req.body.otp.join("");
    otp = otp.toLowerCase();
    if (req.session.otp == otp) {
      await user
        .findOneAndUpdate(
          { _id: req.params.id },
          { is_verified: 0 },
          { new: true }
        )
        .then((updated) => {
          req.session.loggedIn = true;
          req.session.user = user;
          res.redirect("userHome");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/user");
        });
    } else {
      console.log("Not success");
      res.render("otp", { message: "wrong otp retry" });
    }
  } catch (err) {
    next(err);
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
    //console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;
    console.log(email);
    const userData = await user.findOne({ email: email, is_verified: 0 });
    //console.log(userData);
    if (userData) {
      console.log("enter");
      //console.log(req.session.user,"oo");
      const passwordMatch = await bcrypt.compare(password, userData.password);
      //console.log(passwordMatch,"p");
      if (passwordMatch == 0) {
        console.log("not match");
        res.render("login", { message: "email and password is incorrect" });
      } else {
        req.session.user = userData;
        console.log("Entered");
        console.log(req.session.isLoggedIn + "Before");
        req.session.isLoggedIn = true;
        res.redirect("/userHome");
        console.log(userData);
      }
    } else {
      res.render("login", { message: "email and password is incorrect" });
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
          console.log(data);
          console.log(data.length);
          res.render("Shop", { data, log: req.session.isLoggedIn });
        });
    }
  } catch (err) {
    console.log(err);
  }
};

//whishlist
const whishList = async (req, res, next) => {
  try {
    res.render("whishList", { log: req.session.isLoggedIn });
  } catch (err) {
    next(err);
  }
};

//cart
// const cart = async (req, res, next) => {
//   try {

//     await productModel
//         .find()
//         .lean()
//         .then((data) => {
//           console.log(data);
//           console.log(data.length);
//           res.render("cart", { data, log: req.session.isLoggedIn });
//         });
//     // res.render("cart", { log: req.session.isLoggedIn });
//   } catch (err) {
//     next(err);
//   }
// };

//myProfile
// const profile = async (req, res, next) => {
//   try {
//     const data = await user.findById(req.session.user._id).lean();
//     console.log("Dataaaaaaaaaa", data.address.length);
//     res.render("myProfile", { data, log: req.session.isLoggedIn });
//   } catch (err) {
//     next(err);
//   }
// };
const profile = async (req, res, next) => {
  // try {
  //   const data = await user.findById(req.session.user._id).lean();
  //   console.log("Dataaaaaaaaaa");
  //   res.render("myProfile", { data, userdata, log: req.session.isLoggedIn });
  // } catch (err) {
  //   next(err);
  // }

  try {
    var userdata = await req.session.user._id;
    user.findById(userdata).then((data) => {
      res.render("myProfile", { data, userdata,log: req.session.isLoggedIn });
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
      res.render("add-address", { data });
    });
  } catch (err) {
    next(err);
  }
};

//add-address
const confirmAddress = async (req, res, next) => {
  try {
    var id = req.session.user._id;
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
    const login = req.session.user._id;
    let oid = new mongodb.ObjectId(login);

    console.log(ad, "lllllllllllllllll");
    const profile = await user.findById(login);
    console.log(profile, "prrrrrr");
    const userAddress = profile.address.id(ad);

    res.render("editaddress", { userAddress });
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

    var id = req.session.user._id;
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
  id = req.session.user._id;
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
    // let coupons = await coupounModel.find({
    //   minimumAmount: { $lte: req.body.total },
    // });
    // console.log(coupons);
    console.log(req.session.user._id, "oooo");
    user.find({ _id: req.session.user._id }).then((data) => {
      console.log(data, "dtaaa");
      res.render("checkOut1", {
        data: data,
        total: req.body.total,
        // coupons,
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
    console.log(req.body.payment);

    const status = req.body.payment;

    const userData = await user.findById(req.session.user._id);
    console.log(userData, "00000");
    const items = [];

    let canPlaceOrder = true; // Initialize a flag to check if the order can be placed

    for (let i = 0; i < userData.cart.length; i++) {
      const product = await productModel.findById(userData.cart[i].productId);

      if (product) {
        console.log(product,"producttttt");
        if (product.quantity < 1) {
          console.log(product.quantity,"qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
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
      user: req.session.user._id,
      items,
      address: userData.address[0],
      paymentMode: status,
      // discount: req.body.discount,
      totalAmount: 0,
      finalAmount: 0,
    });

    console.log(order, "Order Created");

    if (order.paymentMode === "cod") {
      console.log("COD: " + order.paymentMode);
      id = req.session.user._id;
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
        order.totalAmount
      );
      res.json({
        payment: false,
        method: "online",
        razorpayOrder: generatedOrder,
        order: order,
      });
    } 
    else if (order.paymentMode === "wallet") {
      id = req.session.user._id;
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
  key_id: "rzp_test_80jNgNYgTgs47P",
  key_secret: "Ag95tYV92s1TcaDaz0Ix79A8",
});

const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
    console.log(total,'totallll');
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
        id = req.session.user._id;
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
    let hmac = crypto.createHmac("sha256", "Ag95tYV92s1TcaDaz0Ix79A8");
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
    var userdata = await req.session.user._id;
    user.findById(userdata).then((data) => {
      res.render("myProfile", { data,log: req.session.isLoggedIn, userdata });
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
    let orders = await orderModel.aggregate([
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

    const user = req.session.user._id;
    console.log(user);
    let orders = await orderModel.aggregate([
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
  var id = req.session.user._id;
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
const wallet = (req,res,next)=>{
  try{
    const userId = req.session.user._id;
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
      res.render("wallet", {log: req.session.isLoggedIn, data: currentproduct, totalpages, currentpage });
    });
  } catch (err) {
    next(err);
  }
}



module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  sendVerifyMail,
  generateOtp,
  validateOtp,
  loadHome,
  logOut,
  shopLoad,
  whishList,
  // cart,
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
};
