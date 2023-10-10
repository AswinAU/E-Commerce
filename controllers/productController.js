const categoryModel = require("../model/category-model");
const productModel = require("../model/product-model");
const sharp = require("sharp");
const fs = require("fs");

module.exports = {
  // allProduct: async (req, res, next) => {
  //   try {
  //     const findproduct = await productModel.find({}).sort({ created_on: -1 });
  //     res.render("view-products", { products: findproduct });
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  allProduct: async (req, res, next) => {
    try {

        const data = await productModel
            .find({})
            .lean();
        data.reverse()
        const itemsperpage = 5;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(data.length / 5);
        const currentproduct = data.slice(startindex, endindex);
        res.render('view-products', { products: currentproduct, data, currentpage, totalpages })
    } catch (err) {
        next(err)
    }
},

showAddProduct: async (req, res, next) => {
  try {
      const findCategory = await categoryModel.find({})
      console.log(findCategory)
      res.render('add-product', { data: findCategory })
  } catch (err) {
      next(err)
  }
},

  addProduct: async (req, res, next) => {
    try {
        console.log("AddProduct")
        console.log(req.body, "bogyyyyyyyy");
        let product = new productModel({
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            regular_price: req.body.regular_price,
            sale_price: req.body.sale_price,
            created_on: Date.now(),
            unit: req.body.units,
            gst: req.body.gst,
            quantity: req.body.quantity,
            images: [req.files[0]?.filename, req.files[1]?.filename, req.files[2]?.filename, req.files[3]?.filename,]
        })
        await product.save().then((statsu) => {
            res.redirect('/admin/all-products')
        })
    } catch (err) {
        next(err)
    }

},

  //edit-product
  editProductPage: async (req, res, next) => {
    try {
      const productId = req.params.id;
      console.log(productId);
      productModel.find({ _id: productId }).then((data) => {
        res.render("edit-product", { data: data });
      });
    } catch (err) {
      next(err);
    }
  },

  //product ///
  editProduct: async (req, res, next) => {
    try {
      console.log(req.files);
      console.log(req.body);

      var id = req.params.id;
      console.log(id);
      var size = req.body.size;
      console.log(req.files);
      if (req.files.length !== 0) {
        console.log(";hehehehehhe");
        await productModel.findByIdAndUpdate(
          id,
          {
            name: req.body.name,
            description: req.body.description,
            regularprice: req.body.regularprice,
            saleprice: req.body.saleprice,
            quantity: req.body.quantity,
            gst: req.body.gst,
            size: size,
            category: req.body.category,
            images: [
              req.files[0].filename,
              req.files[1].filename,
              req.files[2].filename,
              req.files[3].filename,
            ],
          },
          { new: true }
        );
        res.redirect("/admin/all-products");
      } else {
        console.log("heloooooooooooo");
        console.log(req.body.sale_price);
        console.log(id);
        let user = await productModel.findById(id);
        console.log(user);
        let product = await productModel.findByIdAndUpdate(
          id,
          {
            name: req.body.name,
            description: req.body.description,
            regular_price: req.body.regular_price,
            sale_price: req.body.sale_price,
            units: req.body.unit,
            taxrate: req.body.taxrate,
            quantity: req.body.quantity,
            size: size,
            category: req.body.category,
            images: [
              req.files[0].filename,
              req.files[1].filename,
              req.files[2].filename,
              req.files[3].filename,
            ],
          },
          { new: true }
        );
        res.redirect("/admin/all-products");
      }
    } catch (err) {
      next(err);
    }
  },

  //productDetails
  productDetails:async(req, res, next)=>{
    try{
      const productId = req.query.id;
      console.log(productId);
      productModel.findById(productId).then((data) => {
        console.log(data.name);
        res.render("product-details", { data, log: req.session.isLoggedIn });
      });
    } catch (err) {
      next(err);
    }
  },

  deleteProduct: async (req, res, next) => {
    id = req.params.id;
    console.log(id);
    await productModel
      .findByIdAndDelete({ _id: id })
      .then((data) => {
        res.redirect("/admin/all-products");
      })
      .catch((err) => {
        next(err);
      });
  },
  
};
