const categoryModel = require("../model/category-model");
const productModel = require("../model/product-model");
const sharp = require("sharp");
const fs = require("fs");

module.exports = {
  //view added products
  allProduct: async (req, res, next) => {
    try {
      const data = await productModel.find({}).lean();
      data.reverse();
      const itemsperpage = 5;
      const currentpage = parseInt(req.query.page) || 1;
      const startindex = (currentpage - 1) * itemsperpage;
      const endindex = startindex + itemsperpage;
      const totalpages = Math.ceil(data.length / 5);
      const currentproduct = data.slice(startindex, endindex);
      res.render("view-products", {
        products: currentproduct,
        data,
        currentpage,
        totalpages,
      });
    } catch (err) {
      next(err);
    }
  },

  //add-product page
  showAddProduct: async (req, res, next) => {
    try {
      const findCategory = await categoryModel.find({});
      res.render("add-product", { data: findCategory });
    } catch (err) {
      next(err);
    }
  },

  //function for adding-product
  addProduct: async (req, res, next) => {
    try {
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
        images: [
          req.files[0]?.filename,
          req.files[1]?.filename,
          req.files[2]?.filename,
          req.files[3]?.filename,
        ],
      });
      await product.save().then((statsu) => {
        res.redirect("/admin/all-products");
      });
    } catch (err) {
      next(err);
    }
  },

  //to render edit-product
  editProductPage: async (req, res, next) => {
    try {
      const productId = req.params.id;
      productModel.find({ _id: productId }).then((data) => {
        res.render("edit-product", { data: data });
      });
    } catch (err) {
      next(err);
    }
  },

  //to edit product-details
  editProduct: async (req, res, next) => {
    try {
      const id = req.params.id;
      const {
        name,
        description,
        regular_price,
        sale_price,
        quantity,
        gst,
        category,
      } = req.body;
      const size = req.body.size; // Assuming size is passed in the request body

      if (req.files && req.files.length > 0) {
        // If new images are uploaded, update the product with new images
        const images = req.files.map((file) => file.filename);

        await productModel.findByIdAndUpdate(
          id,
          {
            name,
            description,
            regular_price,
            sale_price,
            quantity,
            gst,
            size,
            category,
            images,
          },
          { new: true }
        );
      } else {
        // If no new images are uploaded, update the product without changing the images
        await productModel.findByIdAndUpdate(
          id,
          {
            name,
            description,
            regular_price,
            sale_price,
            quantity,
            gst,
            size,
            category,
          },
          { new: true }
        );
      }

      res.redirect("/admin/all-products");
    } catch (err) {
      next(err);
    }
  },

  // render productDetails
  productDetails: async (req, res, next) => {
    try {
      const productId = req.query.id;
      productModel.findById(productId).then((data) => {
        res.render("product-details", { data, log: req.session.isLoggedIn });
      });
    } catch (err) {
      next(err);
    }
  },

  //to delete product details
  deleteProduct: async (req, res, next) => {
    id = req.params.id;
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
