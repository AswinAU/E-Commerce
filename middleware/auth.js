const userModel = require("../model/userModel")

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
        console.log('grllsrj');
            // User is logged in
            next();
        } else {
            // User is not logged in
            res.redirect("/login"); // Redirect to login page or any other appropriate route
        }
    } catch (err) {
        console.log(err.message);
        // You might want to add more specific error handling here if needed
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
            res.redirect("/");
        } else {
            // User is already logged out
            next();
        }
    } catch (err) {
        console.log(err.message);
        // You might want to add more specific error handling here if needed
    }
};


// Middleware to check if the user is blocked
const checkBlocked = async (req, res, next) => {
    const blocked = await userModel.findOne({ _id: req.session.user });

    // if (!blocked) {
    //     // User session not found, handle accordingly (e.g., redirect to login page)
    //     return res.redirect('/login');
    // }

    console.log(blocked, "bk");
    if (blocked.is_verified == 0) {
        console.log("entered");
        res.status(403).send('Access denied. Your account has been blocked.');
    } else {
        console.log("next");
        next();
    }
};



module.exports = {
    isLogin,
    isLogout,
    checkBlocked,
};
