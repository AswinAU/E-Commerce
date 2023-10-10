

const isLogin = async (req, res, next) => {
    try {
        if (req.session.user) {
        
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

module.exports = {
    isLogin,
    isLogout,
};
