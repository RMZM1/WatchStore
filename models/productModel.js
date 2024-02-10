const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    oldPrice:{
      type: Number,
    },
    salePercent:{
      type: Number,
    },
    stock: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    productPic: {
      type: String,
    },
    productPicCloudinaryID: {
      type: String,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    ratings:{
      type: Number,
    },
    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userProfilePic: String,
        userName: String,
        comment: String,
        rating: Number,
        createdAt: Date,
      },
    ],
    keyword: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
