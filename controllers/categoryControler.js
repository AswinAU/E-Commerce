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

  // add category
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
      console.log(totalProducts, "totalProducts");
      console.log(totalPages);

      const data = await categoryModel
        .find({})
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .sort({ createdOn: -1 })
        .lean();
      console.log(data, "dataaaaa");
      res.render("page-categories", { data, currentPage, totalPages, search });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error"); // Handle the error appropriately
    }
  },

  addCategory: async (req, res, next) => {
    try {
      const cat = req.body;
      console.log(cat, "cattttttttt");
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
        console.log(savedCategory);

        res.redirect("/admin/categories");
      } else {
        console.log(req.file);
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

  //category
  editCategoryPage: async (req, res, next) => {
    try {
      console.log("catbody");
      console.log(req.body, "catbody");
      const categoryId = req.params.id;
      console.log(categoryId);
      categoryModel.find({ _id: categoryId }).then((data) => {
        console.log(data, "loooooo");
        res.render("edit-category", { data: data });
      });
    } catch (err) {
      next(err);
    }
  },

  delete: (req, res, next) => {
    try {
      categoryModel.findByIdAndDelete(req.params.id).then((status) => {
        res.redirect("/admin/categories");
      });
    } catch (err) {
      next(err);
    }
  },

  categorySearch: async (req, res, next) => {
    try {
      console.log(req.body.search, "loggg");
      let data = await categoryModel.find({
        name: { $regex: `${req.body.search}`, $options: "i" },
      });
      console.log(data);
      res.render("page-categories", { data });
    } catch (err) {
      next(err);
    }
  },
};
