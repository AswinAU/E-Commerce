const dotenv = require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const errorHandler = require("./middleware/errorhandler");

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

const nocache = require("nocache");
app.use(nocache());

app.use(morgan("dev"));
app.use("/public", express.static("public"));

//user route;
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

//for userRoute
const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

//for adminRoute
const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

app.listen(process.env.PORT, () => {
  console.log(`server running on http://localhost:${process.env.PORT}/`);
});
