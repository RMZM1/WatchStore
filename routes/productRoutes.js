const express = require("express");
const bodyParser = require("body-parser");
const ProductRouter = express.Router();
const productCtrl = require("../controllers/ProductController");
const upload = require("../config/multer");

ProductRouter.use(bodyParser.urlencoded({ extended: false }));

ProductRouter.post("/addProduct", upload.single("ProductPic"), productCtrl.addProduct);
ProductRouter.post("/updateProduct", upload.single("ProductPic"), productCtrl.updateProduct);
ProductRouter.post("/deleteProduct", productCtrl.deleteProduct);
ProductRouter.post("/createProductReview", productCtrl.createProductReview);

ProductRouter.get("/getAllProducts", productCtrl.getAllProducts);
ProductRouter.get("/getSingleProduct", productCtrl.getSingleProduct);
module.exports = ProductRouter;
