const dotenv = require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nocache = require("nocache");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const app = express();

app.use(nocache());
app.use(morgan("dev"));
app.use("/public", express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//for userRoute
app.use("/", userRoute);
userRoute.set("views", "./views/users");

//for adminRoute
app.use("/admin", adminRoute);
adminRoute.set("views", "./views/admin");

app.use((req, res, next) => {
  res.status(404).render("404");
});

app.listen(process.env.PORT, () => {
  console.log(`server running on http://localhost:${process.env.PORT}/`);
});
