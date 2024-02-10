const UserModel = require("../models/userModel");
const AdminModel = require("../models/adminModel");
const ProductModel = require("../models/productModel");
const cloudinary = require("../config/cloudinary");

const asyncHandler = require("express-async-handler");
const path = require("path");
// import .env file
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

// add/Create a product
const addProduct = asyncHandler(async (req, res, next) => {
  let resp = {
    success: false,
    message: "",
  };
  let pic = req.file;
  const {
    title,
    price,
    stock,
    description,
    keyword,
    category,
    createdBy,
    updatedBy,
  } = req.body;
  if (!pic) {
    resp.message = "Please Upload an image";
  } else if (
    !title ||
    !price ||
    !stock ||
    !description ||
    !keyword ||
    !category ||
    !createdBy ||
    !updatedBy
  ) {
    resp.message = "Please enter All the fields";
  } else {
    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    // save Product
    const Product = new ProductModel({
      title,
      price,
      stock,
      description,
      keyword,
      category,
      createdBy,
      updatedBy,
      productPic: result.secure_url,
      productPicCloudinaryID: result.public_id,
    });

    await Product.save();

    if (!Product) {
      resp.message = "Something went wrong";
    } else {
      resp.success = true;
      resp.message = "product Added Successfully";
    }
  }
  req.resp = resp;
  next();
});

// Update Product
const updateProduct = asyncHandler(async (req, res, next) => {
  const resp = {
    success: false,
    message: "",
  };

  let pic = req.file;
  const {
    id,
    title,
    price,
    newPrice,
    salePercent,
    stock,
    description,
    keyword,
    category,
    updatedBy,
  } = req.body;

  if (
    !id ||
    !title ||
    !price ||
    !stock ||
    !description ||
    !keyword ||
    !category ||
    !updatedBy
  ) {
    resp.message = "Please enter all Required the fields";
  } else {
    let Product = await ProductModel.findOne({ _id: id });
    if (!Product) {
      resp.message = "Product is not found";
    } else {
      // Update Product
      if (newPrice || salePercent || pic) {
        if (newPrice && salePercent && pic) {
          await cloudinary.uploader.destroy(Product.productPicCloudinaryID); //delete previous
          const result = await cloudinary.uploader.upload(req.file.path); //upload new
          await ProductModel.findOneAndUpdate(
            { _id: id },
            {
              $set: {
                title: title,
                price: newPrice,
                stock: stock,
                oldPrice: price,
                salePercent: salePercent,
                productPic: result.secure_url,
                productPicCloudinaryID: result.public_id,
                description: description,
                keyword: keyword,
                category: category,
                updatedBy: updatedBy,
              },
            }
          );
        } else if (pic) {
          //  delete Previous Image from cloudinary if new pic is uploaded
          await cloudinary.uploader.destroy(Product.productPicCloudinaryID); //delete previous
          const result = await cloudinary.uploader.upload(req.file.path); //upload new
          await ProductModel.findOneAndUpdate(
            { _id: id },
            {
              $set: {
                title: title,
                price: price,
                stock: stock,
                productPic: result.secure_url,
                productPicCloudinaryID: result.public_id,
                description: description,
                keyword: keyword,
                category: category,
                updatedBy: updatedBy,
              },
            }
          );
        } else if (newPrice && salePercent) {
          await ProductModel.findOneAndUpdate(
            { _id: id },
            {
              $set: {
                title: title,
                price: newPrice,
                stock: stock,
                oldPrice: price,
                salePercent: salePercent,
                description: description,
                keyword: keyword,
                category: category,
                updatedBy: updatedBy,
              },
            }
          );
        } else if (newPrice) {
          await ProductModel.findOneAndUpdate(
            { _id: id },
            {
              $set: {
                title: title,
                price: newPrice,
                stock: stock,
                oldPrice: price,
                description: description,
                keyword: keyword,
                category: category,
                updatedBy: updatedBy,
              },
            }
          );
        } else {
          await ProductModel.findOneAndUpdate(
            { _id: id },
            {
              $set: {
                title: title,
                stock: stock,
                price: price,
                salePercent: salePercent,
                description: description,
                keyword: keyword,
                category: category,
                updatedBy: updatedBy,
              },
            }
          );
        }
      } else {
        await ProductModel.findOneAndUpdate(
          { _id: id },
          {
            $set: {
              title: title,
              price: price,
              stock: stock,
              description: description,
              keyword: keyword,
              category: category,
              updatedBy: updatedBy,
            },
          }
        );
      }
      resp.success = true;
      resp.message = "Product Updated Successfully";
    }
  }
  req.resp = resp;
  next();
});

// delete Product
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await ProductModel.findById(req.body.productId);
  if (!product) {
    res.status(404);
    throw new Error("Product is not found with this id");
  }
  //delete from cloudinary
  await cloudinary.uploader
    .destroy(product.productPicCloudinaryID)
    .then()
    .catch((e) => {
      throw new Error("Something went wrong while deleting from Cloudinary");
    });

  // delete from MongoDB
  await ProductModel.findOneAndDelete({ _id: req.body.productId })
    .then(() => {
      res.status(200).json({
        success: true,
        message: "Product Removed Successfully",
      });
    })
    .catch((e) => {
      throw new Error("Something went wrong while deleting from db");
    });
  next();
});

// Create New Review or Update the review
const createProductReview = asyncHandler(async (req, res, next) => {
  const { rating, comment, productId, userId } = req.body;

  // find user
  let user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User Does not exist or signed out");
  }

  const review = {
    userId: userId,
    userName: user.fullName,
    rating: (rating / 5) * 100, //get percentage of given rating i.e 1 star = 20% and 5 star = 100%
    comment: comment,
    createdAt: Date.now(),
  };

  const product = await ProductModel.findById(productId);

  product.reviews.push(review);
  product.numOfReviews = product.reviews.length;

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save();

  res.status(200).json({
    success: true,
    Message: "Review Recorded",
  });
  next();
});

// single Product
const getSingleProduct = asyncHandler(async (req, res, next) => {
  const product = await ProductModel.findById(req.body.id);
  if (!product) {
    res.status(404);
    throw new Error("Product is not found with this id");
  }
  res.status(200).json({
    success: true,
    product,
  });
  next();
});

// functions to get data
const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  let products = await ProductModel.find();
  let resp = {
    success: false,
    products: {},
  };
  let newProducts = products.filter(function (product) {
    return product.keyword.toLowerCase().includes("featured");
  });

  // get limited number of products
  let featuredProducts = [];
  let MaxProducts = 8;
  for (let i = 0; i < MaxProducts; i++) {
    featuredProducts.push(newProducts[i]);
  }

  if (newProducts.length <= 0) {
    req.resp = resp;
  } else if (newProducts.length < 8) {
    resp.success = true;
    resp.products = newProducts;
    req.resp = resp;
  } else {
    resp.success = true;
    resp.products = featuredProducts;
    req.resp = resp;
  }
  next();
});
const getAllProducts = asyncHandler(async (req, res, next) => {
  const productsCount = await ProductModel.countDocuments();
  const products = await ProductModel.find();
  let resp = {
    success: false,
    products: {},
    productsCount,
  };
  if (!products || products.length <= 0) {
    req.resp = resp;
  } else {
    resp.success = true;
    resp.products = products;
    resp.productsCount = productsCount;
    req.resp = resp;
  }
  next();
});
const getSingleProductDetails = asyncHandler(async (req, res, next) => {
  const product = await ProductModel.findById(req.params.id);
  let MaxProducts = 4;
  let resp = {
    success: false,
    product: {},
    relatedProducts: {},
  };
  if (!product) {
    req.resp = resp;
  } else {
    // find all products
    let products = await ProductModel.find();
    // Filter
    // Get Product KeyWords and make an array to find similar products
    let KeyWords = product.keyword.split(",");
    let keyword = KeyWords[0].trim().toLowerCase();
    // get limited number of related products
    let related = products.filter(function (product) {
      return product.keyword.toLowerCase().includes(keyword);
    });
    let relatedProducts = [];
    if (related.length >= MaxProducts) {
      for (let i = 0; i < MaxProducts; i++) {
        relatedProducts.push(related[i]);
      }
    } else {
      for (let i = 0; i < related.length; i++) {
        relatedProducts.push(related[i]);
      }
    }
    // return
    resp.success = true;
    resp.product = product;
    resp.relatedProducts = relatedProducts;
    req.resp = resp;
  }
  next();
});
const getcategoryWiseProducts = asyncHandler(async (req, res, next) => {
  let products = await ProductModel.find();

  // Get Categories
  let category = req.params.category.toString().trim();
  let categories = category.split(".");
  let resp = {
    success: false,
    products: {},
  };
  if (!products) {
    req.resp = resp;
  } else {
    // Filter
    // Get Product category and make an array to find similar products
    let related;
    if (!categories[2]) {
      related = products.filter(function (product) {
        return product.category.toLowerCase().includes(categories[1]);
      });
    } else {
      related = products.filter(function (product) {
        let p;
        if(product.category.toLowerCase().includes(categories[1]) && product.category.toLowerCase().includes(categories[2])){
          p=product;
          }
        return p;
      });
    }

    if (related.length <= 0) {
      req.resp = resp;
    } else {
      resp.success = true;
      resp.products = related;
      resp.productsCount = related.length;
      req.resp = resp;
    }
  }
  next();
});
const searchProductsResults = asyncHandler(async (req, res, next) => {
  let products = await ProductModel.find();

  let searchValue = req.body.searchValue;
  let resp = {
    success: false,
    products: {},
  };

  if (!products) {
    req.resp = resp;
  } else {
    // Filter
    // Get Product category and make an array to find similar products
    console.log(req.body.searchValue);
    let related = products.filter(function (product) {
      let p;
      if (
        product.category.toLowerCase().includes(searchValue) ||
        product.keyword.toLowerCase().includes(searchValue) ||
        product.description.toLowerCase().includes(searchValue) ||
        product.title.toLowerCase().includes(searchValue)
      ){
        p = product;
      }
      return p;
    });

    if (related.length <= 0) {
      req.resp = resp;
    } else {
      resp.success = true;
      resp.products = related;
      resp.productsCount = related.length;
      req.resp = resp;
    }
  }
  next();
});

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getAllProducts,
  getSingleProduct,
  getFeaturedProducts,
  getSingleProductDetails,
  getcategoryWiseProducts,
  searchProductsResults,
};
