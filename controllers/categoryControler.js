const { Rembg } = require("rembg-node");
const rembg = new Rembg();
const categoryModel = require("../model/category-model");
const productModel = require("../model/product-model");
const productController = require("../controllers/productController");

module.exports = {
  //categories page
  categories: async (req, res, next) => {
    try {
      categoryModel.find({}).then((data) => {
        currentPage = '/admin/category'
        res.render("page-categories", { data , currentPage });
      });
    } catch (err) {
      res.render('404')
    }
  },

  // render add category page
  category: async (req, res, next) => {
    try {
      const currentPage = parseInt(req.query.page) || 1;
      const itemsPerPage = 2;
      const search = req.query.search || "";
      const searchQuery = {
        $or: [
          { "address.number": { $regex: ".*" + search + ".*", $options: "i" } },
          { "address.name": { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      };
      const totalProducts = await categoryModel.countDocuments({});
      const totalPages = Math.ceil(totalProducts / itemsPerPage);
      
      const data = await categoryModel
        .find({})
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .sort({ createdOn: -1 })
        .lean();
      res.render("page-categories", { data, currentPage, totalPages, search });
    } catch (err) {
      console.error("Internal Server Error");
      res.render('404')// Handle the error appropriately
    }
  },

  //function to add-category
  addCategory: async (req, res, next) => {
    try {
      const cat = req.body;

      const catNamePattern = new RegExp(`^${cat.category}$`, "i");

      const existingCategory = await categoryModel
        .findOne({ category: catNamePattern })
        .lean();

      if (!existingCategory) {
        const category = new categoryModel({ 
          category: cat.category,
          category_offer_price: cat.category_offer_price,
          // description: cat.description,
          image: req.file.filename,
        });

        const savedCategory = await category.save();

        res.redirect("/admin/categories");
      } else {
        const input = req.file.path;
        const output = await rembg.remove(input);
        await output
          .webp()
          .toFile("./public/upload/category/" + req.file.filename);

        res.redirect("/admin/categories"); // Correct the redirect URL
      }
    } catch (err) {
      req.session.categoryError = true;
      res.render('404')
    }
  },

  //render edit-category page
  editCategoryPage: async (req, res, next) => {
    try {
      const categoryId = req.params.id;

      categoryModel.find({ _id: categoryId }).then((data) => {
        currentPage = '/admin/category'
        res.render("edit-category", { data: data , currentPage});
      });
    } catch (err) {
      res.render('404')
    }
  },

  //function to edit category
  updateCategory: async (req, res, next) => {
    try {
      const categoryId = req.params.id;
      const updatedCategoryData = req.body;
      const existingCategory = await categoryModel.findById(categoryId);

      if (!existingCategory) {
        return res.status(404).send("Category not found");
      }

      // Update the category fields as needed
      existingCategory.category = updatedCategoryData.category;
      existingCategory.category_offer_price = updatedCategoryData.category_offer_price;
      existingCategory.description = updatedCategoryData.description;

      await existingCategory.save();

      const products = await productModel.find({ category: existingCategory.category });
      console.log(products, 'products');

      for (const product of products) {
        const productId = product._id;
        const data = await productModel.findById(productId);

        // Assuming productController.editProduct accepts both productId and data
        await productController.editProduct(data);
      }

      res.redirect("/admin/categories");
    } catch (err) {
      req.session.categoryError = true;
      res.redirect("/edit-C/:id");
      res.render('404')
    }
  },

  //to delete category
  delete: (req, res, next) => {
    try {
      categoryModel.findByIdAndDelete(req.params.id).then((status) => {
        res.redirect("/admin/categories");
      });
    } catch (err) {
      res.render('404')
    }
  },

  //to search category
  categorySearch: async (req, res, next) => {
    try {
      let data = await categoryModel.find({
        name: { $regex: `${req.body.search}`, $options: "i" },
      });

      res.render("page-categories", { data });
    } catch (err) {
      res.render('404')
    }
  },
};
