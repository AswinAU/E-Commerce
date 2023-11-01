const { Rembg } = require("rembg-node");
const rembg = new Rembg();
//const sharp = require('sharp');
const categoryModel = require("../model/category-model");

module.exports = {
  //categories page
  categories: async (req, res, next) => {
    try {
      categoryModel.find({}).then((data) => {
        res.render("page-categories", { data });
      });
    } catch (err) {
      next(err);
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
      console.error(err);
      res.status(500).send("Internal Server Error"); // Handle the error appropriately
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
          base_price: cat.basePrice,
          description: cat.description,
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

      res.redirect("back");
      next(err);
    }
  },

  //render edit-category page
  editCategoryPage: async (req, res, next) => {
    try {
      const categoryId = req.params.id;

      categoryModel.find({ _id: categoryId }).then((data) => {
        res.render("edit-category", { data: data });
      });
    } catch (err) {
      next(err);
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
      existingCategory.base_price = updatedCategoryData.basePrice;
      existingCategory.description = updatedCategoryData.description;

      // Check if an image file is uploaded
      // if (req.file) {
      //     const input = req.file.path;
      //     const output = await rembg.remove(input);
      //     await output.webp().toFile("./public/upload/category/" + req.file.filename);
      //     existingCategory.image = req.file.filename;
      // }

      await existingCategory.save();
      res.redirect("/admin/categories");
    } catch (err) {
      req.session.categoryError = true;
      res.redirect("/edit-C/:id");
      next(err);
    }
  },

  //to delete category
  delete: (req, res, next) => {
    try {
      categoryModel.findByIdAndDelete(req.params.id).then((status) => {
        res.redirect("/admin/categories");
      });
    } catch (err) {
      next(err);
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
      next(err);
    }
  },
};
