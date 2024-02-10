const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type:String,
    },
    userEmail:{
      type:String,
    },
    orderItems: [
      {
        productName:{
            type: String,
            required:true,
        },
        productImg: {
            type: String,
            required:true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        productPrice: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },

    deliveryAddress: {
      type: String,
      required: true,
    },
    postalCode:{
      type:String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "Pending",
    },
    updatedBy: {
      type:  mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
