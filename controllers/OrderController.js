const OrderModel = require("../models/orderModel");
const UserModel = require("../models/userModel");
const AdminModel = require("../models/adminModel");
const ProductModel = require("../models/productModel");
const transporter = require("../config/nodeMailer");

const asyncHandler = require("express-async-handler");
// orderItems[] totalPrice userId deliveryAddress status
const path = require("path");
// import .env file
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const newOrder = asyncHandler(async (req, res) => {
  const {
    userId,
    productId,
    productImg,
    productPrice,
    productName,
    quantity,
    deliveryAddress,
    postalCode,
    DeliveryCharges,
  } = req.body;
  let orderItems = [];

  let ProductsNamesMailingOptions = [];
  // Traverse the products
  for (let i = 0; i < productId.length; i++) {
    ProductsNamesMailingOptions.push(`${productName[i]} x ${quantity[i]}`);
    let orderItem = {
      productImg: productImg[i],
      productName: productName[i],
      quantity: quantity[i],
      productPrice: productPrice[i],
      price: productPrice[i] * quantity[i],
      productId: productId[i],
    };
    orderItems.push(orderItem);
  }

  let total = 0;
  for (let i = 0; i < orderItems.length; i++) {
    total = total + orderItems[i].price;
  }
  total = total + DeliveryCharges;
  // Now save order
  const User = await UserModel.findById(userId);
  const Order = new OrderModel({
    userId,
    userName: User.fullName,
    userEmail: User.email,
    orderItems,
    totalPrice: total,
    deliveryAddress,
    postalCode,
  });
  // Save Order
  await Order.save();
  if (!Order) {
    throw new Error("Something Went wrong");
  }
  // Find User and save orderId there
  let data = {
    OrderId: Order._id,
  };

  User.Orders.push(data);
  await User.save();

  // Now send mail to user about order info
  let mailOptions = {
    from: process.env.Email,
    to: User.email,
    subject: "Order on WatchStore",
    html: `<h5>An Order Has Been Placed By your account</h5
    <h5>Order Details</h5>
    <div>OrderId: <span>${Order.userId}</span></h5>
    <div>Address: <span>${Order.deliveryAddress}</span></h5>
    <div>postal Code: <span>${Order.postalCode}</span></h5>
    <div>Total Price: <span>$${Order.totalPrice}</span></h5>
    <div>Status: <span>${Order.status}</span></h5>
    <div>Ordered Products: <span>${ProductsNamesMailingOptions}</span></h5>
    `,
  };
  transporter.sendMail(mailOptions);

  res.status(200).json({
    success: true,
  });
});

// --Admin
const updateOrder = asyncHandler(async (req, res, next) => {
  const resp = {
    success: false,
    message: "",
  };
  const {
    orderId,
    deliveryAddress,
    postalCode,
    status,
    updatedBy,
  } = req.body;

  // Now find and update order
  const Order = await OrderModel.findById(orderId);
  if (Order) {
    Order.deliveryAddress = deliveryAddress;
    Order.postalCode = postalCode;
    Order.status = status;
    Order.updatedBy = updatedBy;
    // Save Order
    await Order.save();
    resp.success = true;
    resp.message = "Updated Successfully";
  } else {
    resp.message = "Something went Wrong Could Not Update order";
  }

  req.resp = resp;
  next();
});

const deleteOrder = asyncHandler(async (req, res) => {
  let order = await OrderModel.findById(req.body.orderId);
  let User = await UserModel.findById(order.userId);

  const indexOfObject = User.Orders.findIndex((object) => {
    return object.OrderId == req.body.orderId;
  });
  User.Orders.splice(indexOfObject, 1);
  await User.save();
  await OrderModel.findByIdAndDelete(req.body.orderId)
    .then(() => {
      res.status(200).json({
        success: true,
        message: "Order Deleted Successfully",
      });
    })
    .catch((e) => {
      throw new Error("Something Went wrong");
    });
});

const getUserOrders = asyncHandler(async (req, res) => {
  const User = await UserModel.findById(req.body.userId);
  if (!User) {
    throw new Error("User Does Not Exist");
  }
  const UserOrders = User.Orders;
  let Orders = [];
  // Find each order and its details and store in Orders[]
  for (let i = 0; i < UserOrders.length; i++) {
    let order = await OrderModel.findById(UserOrders[i].OrderId);
    Orders.push(order);
  }
  res.status(200).json({
    success: true,
    Orders,
  });
});

const getOrder = asyncHandler(async (req, res, next) => {
  const Order = await OrderModel.findById(req.params.orderId);
  const resp = {
    success: false,
    message: "Order deleted or Something went wrong",
    order: {},
    user: {},
  };
  if (!Order) {
    req.resp = resp;
  } else {
    const user = await UserModel.findById(Order.userId);
    resp.success = true;
    resp.order = Order;
    resp.user = user;
    req.resp = resp;
  }
  next();
});

// --Admin
const getAllOrders = asyncHandler(async (req, res) => {
  let Orders = await OrderModel.find();
  res.status(200).json({
    success: true,
    Orders,
  });
});

module.exports = {
  newOrder,
  updateOrder,
  deleteOrder,
  getUserOrders,
  getAllOrders,
  getOrder,
};
