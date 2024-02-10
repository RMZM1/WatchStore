const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const errorHandler = require("./middlewares/errorHandle");
const asyncHandler = require("express-async-handler");
const hbs = require("hbs");
const upload = require("./config/multer");
const MSGCtrl = require("./controllers/MessageController");
const MessageModel = require("./models/messageModel");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const userModel = require("./models/userModel");
const userCtrl = require("./controllers/UserController");
const adminCtrl = require("./controllers/AdminController");
const adminModel = require("./models/adminModel");
const orderModel = require("./models/orderModel");
const orderCtrl = require("./controllers/OrderController");
const productModel = require("./models/productModel");
const ProductController = require("./controllers/ProductController");

require("./config/db");
// import .env file
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const app = express();
// CORS
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser());

app.use(express.json());
app.use(errorHandler);

//hbs
const partialsviewsPath = path.join(__dirname, "views/partial/");

app.set("view engine", "hbs");
hbs.registerPartials(partialsviewsPath);
hbs.registerHelper("dateFormat", require("handlebars-dateformat"));

//use static files from public
app.use(express.static("public"));

// AuthUser Function
const authUser = asyncHandler(async (req, res, next) => {
  let resp = {
    success: false,
    message: "",
    userId: null,
  };
  // get token from cookie
  const token = req.cookies.token;
  if (!token) {
    resp.message = "Please Login to use this Service";
    req.resp = resp;
  } else {
    const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // tempered token
    if (!tokenVerified) {
      resp.message = "Something Went Wrong Please try again later";
      req.resp = resp;
    } else {
      const { id } = tokenVerified;
      let user = await userModel.findById(id).select("-password");
      if (!user) {
        resp.message = "Something Went Wrong Please try again later";
        req.resp = resp;
      } else {
        resp.success = true;
        resp.userId = id;
        resp.message = "";
        req.resp = resp;
      }
    }
  }
  next();
});
// Auth Admin Function
const authAdmin = asyncHandler(async (req, res, next) => {
  let resp = {
    success: false,
    message: "",
    adminId: null,
  };
  // get token from cookie
  const token = req.cookies.adminToken;
  if (!token) {
    resp.message = "Only Admin Can Use this if you are Admin login";
    req.resp = resp;
  } else {
    const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // tempered token
    if (!tokenVerified) {
      resp.message = "Something Went Wrong Please try again later";
      req.resp = resp;
    } else {
      const { id } = tokenVerified;
      let admin = await adminModel.findById(id).select("-password");
      if (!admin) {
        resp.message = "Something Went Wrong Please try again later";
        req.resp = resp;
      } else {
        resp.success = true;
        resp.adminId = id;
        resp.message = "";
        req.resp = resp;
      }
    }
  }
  next();
});

// HBS Routes
app.get("/", ProductController.getFeaturedProducts, async (req, res) => {
  const resp = {
    success: req.resp.success,
    products: req.resp.products,
    userId: null,
  };
  const token = req.cookies.token;
  if (!token) {
    resp.userId = null;
  } else {
    const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { id } = tokenVerified;
    resp.userId = id;
  }
  res.render("index", { resp });
});
app.get("/shop", ProductController.getAllProducts, async (req, res) => {
  const resp = {
    success: req.resp.success,
    products: req.resp.products,
    productsCount: req.resp.productsCount,
    userId: null,
  };
  const token = req.cookies.token;
  if (!token) {
    resp.userId = null;
  } else {
    const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { id } = tokenVerified;
    resp.userId = id;
  }
  res.render("shop", { resp });
});
app.get(
  "/showProductDetails:id",
  ProductController.getSingleProductDetails,
  async (req, res) => {
    const resp = {
      success: req.resp.success,
      product: req.resp.product,
      relatedProducts: req.resp.relatedProducts,
      userId: null,
    };
    const token = req.cookies.token;
    if (!token) {
      resp.userId = null;
    } else {
      const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const { id } = tokenVerified;
      resp.userId = id;
    }
    res.render("product", { resp });
  }
);
app.get(
  "/shop:category",
  ProductController.getcategoryWiseProducts,
  async (req, res) => {
    const resp = {
      success: req.resp.success,
      products: req.resp.products,
      productsCount: req.resp.productsCount,
      userId: null,
    };
    const token = req.cookies.token;
    if (!token) {
      resp.userId = null;
    } else {
      const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const { id } = tokenVerified;
      resp.userId = id;
    }
    res.render("shop", { resp });
  }
);
app.post(
  "/searchProductsResults",
  ProductController.searchProductsResults,
  async (req, res) => {
    const resp = {
      success: req.resp.success,
      products: req.resp.products,
      productsCount: req.resp.productsCount,
      userId: null,
    };
    const token = req.cookies.token;
    if (!token) {
      resp.userId = null;
    } else {
      const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const { id } = tokenVerified;
      resp.userId = id;
    }
    res.render("shop", { resp });
  }
);

app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/contact", (req, res) => {
  res.render("contact");
});
app.post("/contact", MSGCtrl.postMSG);

app.get("/login", authUser, async (req, res) => {
  let response = req.resp;
  let resp = {
    success: false,
    user: {},
    userOrders: {},
  };

  if (!response.success) {
    res.render("login");
  } else {
    // find User
    const user = await userModel.findById(response.userId);
    // Get User orders
    const orders = user.Orders;
    const userOrders = [];
    for (let i = 0; i < orders.length; i++) {
      let order = await orderModel.findById(orders[i].OrderId);
      userOrders.push(order);
    }

    resp.success = true;
    resp.user = user;
    resp.userOrders = userOrders;
    res.render("userDashboard", { resp });
  }
});
// User Routes
app.post("/login", userCtrl.signInUser, (req, res) => {
  let resp = req.resp;
  if (resp.success) {
    res.redirect("/login");
  } else {
    res.render("error", { message: resp.message });
  }
});
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});
app.get("/verify", (req, res) => {
  res.render("verify");
});

app.get("/forgotPassword", (req, res) => {
  res.render("forgotPassword");
});

app.get("/wishlist", authUser, userCtrl.likedProducts, (req, res) => {
  const resp = req.resp;
  res.render("wishlist", { resp });
});

app.get("/cart", authUser, userCtrl.cartItems, (req, res) => {
  const resp = req.resp;
  res.render("cart", { resp });
});

app.get("/showOrderDetails:orderId", orderCtrl.getOrder, (req, res) => {
  const resp = req.resp;
  res.render("order", { resp });
});

// Admin
app.get("/admin", authAdmin, async (req, res) => {
  let response = req.resp;
  let resp = {
    success: false,
    admin: {},
    admins: {},
    orders: {},
    products: {},
    messages: {},
  };

  if (!response.success) {
    res.render("adminLogin");
  } else {
    // find User
    const admin = await adminModel.findById(response.adminId);
    // Get all orders
    const orders = await orderModel.find();
    const products = await productModel.find();
    const admins = await adminModel.find();
    const messages = await MessageModel.find();
    resp.success = true;
    resp.admin = admin;
    resp.admins = admins;
    resp.orders = orders;
    resp.products = products;
    resp.messages = messages;
    res.render("adminDashBoard", { resp });
  }
});

app.post("/admin", adminCtrl.signInAdmin, async (req, res) => {
  let resp = req.resp;
  if (resp.success) {
    res.redirect("/admin");
  } else {
    res.render("error", { message: resp.message });
  }
});

app.get("/adminLogout", (req, res) => {
  res.clearCookie("adminToken");
  res.redirect("/admin");
});

app.get("/adminForgotPassword", (req, res) => {
  res.render("adminForgotPassword");
});
app.get("/adminVerifyEmail", (req, res) => {
  res.render("adminVerifyEmail");
});

app.post("/signUpAdmin", adminCtrl.signUpAdmin, async (req, res) => {
  let resp = req.resp;
  if (resp.success) {
    res.redirect("/admin");
  } else {
    message = resp.message;
    res.render("error", { message });
  }
});

app.post(
  "/addProduct",
  upload.single("ProductPic"),
  ProductController.addProduct,
  async (req, res) => {
    let resp = req.resp;
    if (resp.success) {
      res.redirect("/admin");
    } else {
      message = resp.message;
      res.render("error", { message });
    }
  }
);

app.post(
  "/updateProduct",
  upload.single("ProductPic"),
  ProductController.updateProduct,
  async (req, res) => {
    let resp = req.resp;
    if (resp.success) {
      res.redirect("/admin");
    } else {
      message = resp.message;
      res.render("error", { message });
    }
  }
);

app.post("/updateOrder", orderCtrl.updateOrder, (req, res) => {
  let resp = req.resp;
  if (resp.success) {
    res.redirect("/admin");
  } else {
    message = resp.message;
    res.render("error", { message });
  }
});

app.post("/deleteMessage", MSGCtrl.deleteMessage);
// routes
const AdminRoutes = require("./routes/adminRoutes");
const UserRoutes = require("./routes/userRoutes");
const ProductRoutes = require("./routes/productRoutes");
const OrderRoutes = require("./routes/orderRoutes");

app.use("/admin", AdminRoutes);
app.use("/user", UserRoutes);
app.use("/product", ProductRoutes);
app.use("/order", OrderRoutes);

app.listen(process.env.PORT, () => {
  console.log(
    `App is running at http://${process.env.HOST}:${process.env.PORT}`
  );
});
