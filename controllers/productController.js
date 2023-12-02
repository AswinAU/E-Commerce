const categoryModel = require("../model/category-model");
const productModel = require("../model/product-model");
// const sharp = require("sharp");
// const fs = require("fs");

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
      const currentPage = '/admin/all-products';
      res.render("view-products", {
        products: currentproduct,
        data,
        currentpage,
        totalpages,
        currentPage,
      });
    } catch (err) {
      res.render('404')
    }
  },

  //add-product page
  showAddProduct: async (req, res, next) => {
    try {
      const findCategory = await categoryModel.find({});
      const currentPage = '/admin/add-product';
      res.render("add-product", { data: findCategory ,currentPage});
    } catch (err) {
      res.render('404')
    }
  },

  //function for adding-product
  addProduct: async (req, res, next) => {
    try {
      
      const category = await categoryModel.findOne({ category: req.body.category });
      const sale_price = req.body.sale_price;

      //calculations on discount
      //product-offer-price
      const specialOffer = req.body.product_offer_price; 
      const product_discount = (sale_price * specialOffer) / 100;
      const product_offer_price = sale_price - product_discount;
      
      //category-offer-price
      const category_offer_price = category.category_offer_price;
      const category_discount = (sale_price * category_offer_price) / 100;
      const category_discount_price = sale_price - category_discount;
      
      if(specialOffer > category_offer_price){
        let product = new productModel({
          name: req.body.name,
          description: req.body.description,
          category: req.body.category,
          regular_price: req.body.regular_price,
          sale_price:product_offer_price,
          product_offer_price:req.body.product_offer_price,
          created_on: Date.now(),
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
      }else{
        let product = new productModel({
          name: req.body.name,
          description: req.body.description,
          category: req.body.category,
          regular_price: req.body.regular_price,
          sale_price:category_discount_price,
          product_offer_price:req.body.product_offer_price,
          created_on: Date.now(),
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
      }
    } catch (err) {
      res.render('404')
    }
  },

  //to render edit-product
  editProductPage: async (req, res, next) => {
    try {
      const productId = req.params.id;
      const findCategory = await categoryModel.find({});
      const currentPage = '/admin/edit';
      productModel.find({ _id: productId }).then((data) => {
        res.render("edit-product", { data: data ,  Data: findCategory , currentPage });
      });
    } catch (err) {
      res.render('404')
    }
  },

  //to edit product-details
  editProduct: async (req, res, next) => {
    console.log('entered--edit-product');
    try {
      let id = req._id||req.params.id;
      id = id.toString()
      const {
        name,
        description,
        regular_price,
        sale_price,
        quantity,
        //category,
      } = req.body||req;
      console.log('entered--edit-product---req');
      const specialOffer = req.product_offer_price||req.body.product_offer_price;
      console.log(specialOffer,'specialOffer');
      const discount = (sale_price * specialOffer) / 100;
      const product_offer_price = sale_price - discount;

      const category = await categoryModel.findOne({ category: req.category||req.body.category });
      const categori = category.category;
      const category_offer_price = category.category_offer_price;

      const category_discount = (sale_price * category_offer_price) / 100;
      const category_discount_price = sale_price - category_discount;

      if(specialOffer > category_offer_price){
        let updateData = {
          name,
          description,
          regular_price,
          sale_price: product_offer_price,
          product_offer_price:specialOffer,
          quantity,
          category:categori,
        };
        console.log('entering to images');
        if (req.files && req.files.length > 0) {
          // If new images are uploaded, update the product with new images
          updateData.images = req.files.map((file) => file.filename);
        }
        console.log('doneeeee');
        await productModel.findByIdAndUpdate(id, updateData, { new: true });
        console.log('updateddd');
        if(req.body){
          res.redirect("/admin/all-products");
        }else{
          
        }
      }else{
        let updateData = {
          name,
          description,
          regular_price,
          sale_price: category_discount_price,
          product_offer_price:specialOffer,
          quantity,
          category:categori,
        };
        console.log('entering to images2222222');
        if (req.files && req.files.length > 0) {
          // If new images are uploaded, update the product with new images
          updateData.images = req.files.map((file) => file.filename);
        }
        console.log('donee2222');
        await productModel.findByIdAndUpdate(id, updateData, { new: true });
        console.log('updatedddd2');
        if(req.body){
          res.redirect("/admin/all-products");
        }else{
          
        }
        
      }

      
    } catch (err) {
      res.render('404')
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
      res.render('404')
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
        // next(err);
        res.render('404')
      });
  },

   deleteProductImage : async(req , res , next) => {
    try { 
      const {productId ,index} = req.body
      const findProduct = await productModel.findOne({ _id: productId })
      console.log(findProduct,'findProductfindProduct');
      if (!findProduct) {
          res.status(404).send('Product not found');
      } else {
          findProduct.images.splice(index, 1)
          findProduct.save()

          res.status(200).json({ message: 'Product image deleted successfully', product: findProduct });
      }
    } catch (err) {
      res.render('404')
    }
  }

};
