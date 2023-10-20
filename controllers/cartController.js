const User = require("../model/userModel");
const productModel = require("../model/product-model");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const session = require("express-session");

module.exports = {
  changeQuantity: async (req, res, next) => {
    try {
      console.log("Chnage qunatity");
      req.body.count = parseInt(req.body.count);
      req.body.quantity = parseInt(req.body.quantity);
      console.log(req.body);
      let product = await productModel.findById(req.body.proId);
      console.log(product, "ddddddddddddddddddddd");
      console.log(req.body.quantity, "ppppppppppppppppppppppp");
      console.log(product.quantity, "oooooooooooooooooooooooo");
      if (req.body.quantity >= product.quantity && req.body.count == 1) {
        res.json({ status: "outOFStock" });
      } else if (req.body.count == -1 && req.body.quantity == 1) {
        console.log("IFFFFFFFFFF");
        User.updateOne(
          { _id: req.body.userId },
          { $pull: { cart: { ProductId: req.body.proId } } }
        ).then((status) => {
          console.log(status);
          res.json({ status: true });
        });
      } else {
        console.log("ELseeeeeee");
        User.updateOne(
          {
            _id: new mongoose.Types.ObjectId(req.body.userId),
            "cart.productId": req.body.proId,
          },
          {
            $inc: {
              "cart.$.quantity": req.body.count,
            },
          },
          {
            new: true,
          }
        ).then((data) => {
          console.log("Thennnnnnnnnn");
          console.log(data);
          res.json({ status: false });
        });
      }
    } catch (err) {
      next(err);
    }
  },

  getCartPage: async (req, res, next) => {
    try {
      console.log("Entered");

      const userId = req.session.user;
      console.log(userId);
      let user = userId;
      const oid = new mongodb.ObjectId(userId);

      cartProducts = await User.aggregate([
        { $match: { _id: oid } },
        { $unwind: "$cart" },
        {
          $project: {
            proId: { $toObjectId: "$cart.productId" },
            quantity: "$cart.quantity",
            size: "$cart.size",
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
      console.log(cartProducts);
      console.log(JSON.stringify(cartProducts));
      if (cartProducts.length > 0) {
        var totalPrice = 0;
        var quantity = 0;

        for (var i = 0; i < cartProducts.length; i++) {
          console.log("hi");
          quantity = cartProducts[i].quantity;
          totalPrice =
            totalPrice +
            quantity * cartProducts[i]?.ProductDetails[0]?.sale_price;
        }
        console.log(totalPrice);

        console.log("cartProducts", cartProducts[0]?.ProductDetails[0]);
        res.render("cart", {
          user,
          cart: cartProducts,
          total: totalPrice,
          log: req.session.isLoggedIn,
        });
      } else {
        res.render("cart", { user, log: req.session.isLoggedIn });
      }

      // res.render('user/cart',{ isLoggedIn: req.session.isLoggedIn,data:cartProducts,total:totalPrice })
    } catch (err) {
      next(err);
    }
  },

  addToCart: async (req, res, next) => {
    try {
      var id = req.session.user;
      console.log(req.session.user, "cartttttttttttt");
      console.log(id);
      var productId = req.query.id;
      console.log(productId, "product id");
      const userData = await User.findById({ _id: id }).lean();
      console.log(userData);
      if (userData.cart) {
        console.log("oi");
        const cartIndex = userData.cart.findIndex(
          (item) => item.productId === productId
        );
        console.log("cartIndex", cartIndex);
        if (cartIndex !== -1) {
          console.log("IFffffffffffffffffffff");
          const productInCart = userData.cart[cartIndex];
          const newQuantity =
            parseInt(productInCart.quantity) + parseInt(req.body.quantity);
          console.log("NEw quantity :", newQuantity);
          await User.updateOne(
            { _id: id, "cart.productId": productId },
            {
              $set: {
                "cart.$.quantity": newQuantity,
                "cart.$.size": req.body.size,
              },
            }
          );
          res.redirect(`/product-details?id=${productId}`);
          // res.redirect('/product-display')
        } else {
          console.log("Product not found in cart.");
          var quantity = parseInt(req.body.quantity);
          User.findByIdAndUpdate(id, {
            $push: {
              cart: {
                productId: productId,
                quantity: quantity,
                size: req.body.size,
              },
            },
          }).then((data) => {
            res.redirect(`/product-details?id=${productId}`);
            // res.redirect('/product-display')
          });
        }
      } else {
        res.send("😒");
      }
    } catch (err) {
      next(err);
    }
  },

  deleteCart: async (req, res) => {
    try {
      await User.updateOne(
        { _id: req.body.userId },
        { $pull: { cart: { productId: req.body.proId } } }
      )
        .then((data) => {
          res.json(true);
        })
        .catch((err) => {
          res.json(false);
        });
    } catch (err) {
      next(err);
    }
  },

  removeProduct: (req, res, next) => {
    try {
      let id = req.session.isLoggedIn._id;
      let proId = req.body.proId;
      console.log(proId);
      console.log(req.session.isLoggedIn);
      User.updateOne(
        { _id: id },
        { $pull: { cart: { productId: proId } } }
      ).then((status) => {
        console.log("heloo froom controller");
        res.json({ status: true });
      });
    } catch (err) {
      next(err);
    }
  },


  addTowhishlist: async(req, res,next) => {
    try{
      var id = req.session.user;
      console.log(req.session.user,"whishlisttttt");
      console.log(id);
      var productId = req.query.id;
      console.log(productId,"product id");
      const userData = await User.findById({ _id: id }).lean();
      console.log(userData);
        if (userData.whishlist) {
          console.log("oi");
          const whishlistIndex = userData.whishlist.findIndex(item => item.productId === productId);
          console.log("whishlist",whishlistIndex)
          if (whishlistIndex !== -1) {
          console.log("IFffffffffffffffffffff")
            const productInwhishlist = userData.whishlist[whishlistIndex];
            const newQuantity = parseInt(productInwhishlist.quantity) + parseInt(req.body.quantity)
            console.log("NEw quantity :" , newQuantity)     
           await User.updateOne(
              { _id: id, "whishlist.productId": productId },
              { $set: { "whishlist.$.quantity": newQuantity, "whishlist.$.size": req.body.size } }
            )
            res.redirect(`/product-details?id=${productId}`)
            // res.redirect('/product-display')
          } else {
            console.log("Product not found in whishlist.");
            var quantity=parseInt(req.body.quantity)
             User.findByIdAndUpdate(id,{$push:{
              whishlist:{productId:productId,quantity:quantity,size:req.body.size}}})
            .then((data)=>{
              res.redirect(`/product-details?id=${productId}`)
              // res.redirect('/product-display')
            })
        }
      }else{
          res.send("😒")
      }
    }catch(err){
      next(err)
    }

    },


    getwhishlistPage: async (req, res, next) => {
      try {
        console.log("Entered");
  
        const userId = req.session.user;
        console.log(userId);
        let user = userId;
        const oid = new mongodb.ObjectId(userId);
  
        whishlistProducts = await User.aggregate([
          { $match: { _id: oid } },
          { $unwind: "$whishlist" },
          {
            $project: {
              proId: { $toObjectId: "$whishlist.productId" },
              quantity: "$whishlist.quantity",
              size: "$whishlist.size",
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
        console.log(whishlistProducts);
        console.log(JSON.stringify(whishlistProducts));
        if (whishlistProducts.length > 0) {
          var totalPrice = 0;
          var quantity = 0;
  
          for (var i = 0; i < whishlistProducts.length; i++) {
            console.log("hi");
            quantity = whishlistProducts[i].quantity;
            totalPrice =
              totalPrice +
              quantity * whishlistProducts[i]?.ProductDetails[0]?.sale_price;
          }
          console.log(totalPrice);
  
          console.log("whishlistProducts", whishlistProducts[0]?.ProductDetails[0]);
          res.render("whishlist", {
            user,
            whishlist: whishlistProducts,
            total: totalPrice,
            log: req.session.isLoggedIn,
          });
        } else {
          res.render("whishlist", { user, log: req.session.isLoggedIn });
        }
  
        // res.render('user/whishlist',{ isLoggedIn: req.session.isLoggedIn,data:whishlistProducts,total:totalPrice })
      } catch (err) {
        next(err);
      }
    },

    deletewhishlist: async (req, res) => {
      try {
        await User.updateOne(
          { _id: req.body.userId },
          { $pull: { whishlist: { productId: req.body.proId } } }
        )
          .then((data) => {
            res.json(true);
          })
          .catch((err) => {
            res.json(false);
          });
      } catch (err) {
        next(err);
      }
    },
};
