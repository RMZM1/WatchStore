const UserModel = require("../models/userModel");
const ProductModel = require("../models/productModel");
const cloudinary = require("../config/cloudinary");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const transporter = require("../config/nodeMailer");
const path = require("path");
const userModel = require("../models/userModel");
// import .env file
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

// SIGNUP
const signUpUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, password2 } = req.body;

  if (!fullName || !email || !password || !password2) {
    res.status(400);
    throw new Error("Please include all fields");
  }
  // check password length
  if (password.length < 8) {
    res.status(400);
    throw new Error("Minimum length of password should be 8 characters");
  }
  if (password !== password2) {
    res.status(400);
    throw new Error("Passwords Does Not Match");
  }

  const emailExist = await UserModel.findOne({ email: email });

  // check if email already exists
  if (emailExist) {
    res.status(400);
    throw new Error("Email already exists");
  }

  // save User
  const User = new UserModel({
    fullName,
    email,
    password,
    verifiedEmail: false,
  });

  await User.save();

  if (!User) {
    throw new Error("Something went wrong");
  }
  const UserId = User._id;
  const token = jwt.sign({ UserId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "20m",
  });

  let mailOptions = {
    from: process.env.Email,
    to: email,
    subject: "Email Activation Link",
    html: `<h1>Please verify your account by clicking below link</h1>
    <a href='http://${process.env.HOST}:${process.env.PORT}/user/activate/${token}'>
    Click Here to Verify
    </a>
    `,
  };

  try {
    transporter
      .sendMail(mailOptions)
      .then(() => {
        return res.status(200).json({
          Message: "Activation link sent to your email! please check",
        });
      })
      .catch((e) => {
        return res.status(404).json({ Message: "Something Went Wrong" });
      });
  } catch (e) {
    throw new Error(e);
  }
});

// Activate Account
const activateAccount = asyncHandler(async (req, res) => {
  // get token
  const token = req.params.token;
  // no token
  if (!token) {
    res.status(401);
    throw new Error("Not authorized! no token");
  }

  // token exists
  const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // tempered token
  if (!tokenVerified) {
    res.status(403);
    throw new Error("Invalid or expired token");
  }

  const { UserId } = tokenVerified;

  // check if user alread exists
  const existUser = await UserModel.findById({ _id: UserId });

  // Verify User Email

  (existUser.verifiedEmail = true), await existUser.save();

  if (!existUser) {
    throw new Error("Something went wrong");
  }
  // generate new token
  const newToken = jwt.sign({ id: existUser._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  res
    .status(201)
    .json({ successMsg: "Verified Successfully! Now You can Login" });
});

// SIGNIN
const signInUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  let resp = {
    success: false,
    message: "",
    User: {},
  };

  if (!email || !password) {
    resp.message = "Please include all fields";
    req.resp = resp;
  } else {
    const User = await UserModel.findOne({ email: email });

    // check if email do not exists
    if (!User) {
      resp.message = "Email does'nt exist! Please sign up first";
      req.resp = resp;
    } else {
      let matchPassword = await bcrypt.compare(password, User.password);
      // if passwords do not match
      if (!matchPassword) {
        resp.message = "Incorrect password!";
        req.resp = resp;
      } else {
        // Exclude Password
        const Userrr = await UserModel.findOne({ email: email }).select(
          "-password"
        );
        const newToken = jwt.sign(
          { id: Userrr._id },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "1d",
          }
        );
        // check if email is verified than sign in else first verify
        if (User.verifiedEmail) {
          // Store token in cookies
          res.cookie("token", newToken, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), //expires in 1 day
            httpOnly: true,
          });
          resp.success = true;
          resp.User = Userrr;
          req.resp = resp;
        } else {
          resp.message = "Please Verify Your Email First";
          req.resp = resp;
        }
      }
    }
  }

  next();
});

// Get email and send activation link to that Email
// verifyEmail
const verifyEmail = asyncHandler(async (req, res) => {
  // Check Email exist or Not
  const userExist = await UserModel.findOne({ email: req.body.email });
  if (!userExist) {
    res.status(400);
    throw new Error("Email does Not exists! please Signup First");
  }

  const UserId = userExist._id;
  const token = jwt.sign({ UserId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "20m",
  });

  let mailOptions = {
    from: process.env.Email,
    to: req.body.email,
    subject: "Email Activation Link",
    html: `<h1>Please verify your account by clicking below link</h1>
      <a href='http://${process.env.HOST}:${process.env.PORT}/user/activate/${token}'>
      Click Here to Verify
      </a>
      `,
  };

  try {
    transporter
      .sendMail(mailOptions)
      .then(() => {
        return res.status(200).json({
          Message: "Activation link sent to your email! please check",
        });
      })
      .catch((e) => {
        return res.status(404).json({ Message: "Something Went Wrong" });
      });
  } catch (e) {
    throw new Error(e);
  }
});

// updating things
const updateProfile = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    newEmail,
    password,
    newPassword,
    cNewPassword,
    address,
    postalCode,
  } = req.body;
  const user = await UserModel.findOne({ email: email });
  user.fullName = fullName;
  user.address = address;
  user.postalCode = postalCode;
  if (newPassword) {
    const checkPass = await bcrypt.compare(password, user.password);
    if (checkPass) {
      if (newPassword.length < 8) {
        throw new Error("Password must contain minimum of 8 characters");
      }
      if (newPassword !== cNewPassword) {
        throw new Error("Passwords does not Match");
      }
      user.password = newPassword;
    } else {
      throw new Error("Incorrect Current Password");
    }
  }
  if (newEmail) {
    user.email = newEmail;
    user.verifiedEmail = false;
    const UserId = user._id;
    const token = jwt.sign({ UserId }, process.env.JWT_SECRET_KEY, {
      expiresIn: "20m",
    });

    let mailOptions = {
      from: process.env.Email,
      to: newEmail,
      subject: "Email Activation Link",
      html: `<h1>Please verify your account by clicking below link</h1>
      <a href='http://${process.env.HOST}:${process.env.PORT}/user/activate/${token}'>
      Click Here to Verify
      </a>
      `,
    };

    try {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          return res.status(200).json({
            Message: "Activation link sent to your email! please check",
          });
        })
        .catch((e) => {
          return res.status(404).json({ Message: "Something Went Wrong" });
        });
    } catch (e) {
      throw new Error(e);
    }
  }

  user.save();
  if (!user) {
    throw new Error("Something went wrong");
  }
  res.status(200).json({ message: "Updated SuccessFully" });
});

const updateProfilePic = asyncHandler(async (req, res) => {
  const profilePic = req.file;
  const user = await UserModel.findOne({ _id: req.body.id });
  if (!user) {
    throw new Error("User Does Not Exist");
  }

  //  delete Previous Image from cloudinary
  if (user.profilePicCloudinaryID) {
    await cloudinary.uploader.destroy(user.profilePicCloudinaryID);
  }

  // Upload to cloudinary
  const result = await cloudinary.uploader.upload(req.file.path);

  await userModel.findOneAndUpdate(
    { _id: req.body.id },
    {
      $set: {
        profilePic: result.secure_url,
        profilePicCloudinaryID: result.public_id,
      },
    }
  );

  res.status(200).json({
    message: "Profile Pic Updated Successfully",
  });
});

// get email if user forgot password and send email and password via link
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, password, password2 } = req.body;
  if (!email || !password || !password2) {
    res.status(400);
    throw new Error("Please include all fields");
  }
  // check password length
  if (password.length < 8) {
    res.status(400);
    throw new Error("Minimum length should be 8 characters");
  }
  if (password2.length < 8) {
    res.status(400);
    throw new Error("Minimum length should be 8 characters");
  }
  if (password !== password2) {
    res.status(400);
    throw new Error("Password Does not Match");
  }

  const emailExist = await UserModel.findOne({ email: email });
  // check if email exists
  if (!emailExist) {
    res.status(400);
    throw new Error("Email does not exist!");
  }

  var salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const token = jwt.sign(
    { email, hashedPassword },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "20m",
    }
  );

  let mailOptions = {
    from: process.env.Email,
    to: email,
    subject: "Email Activation Link",
    html: `<h1>To Change Your Password Click the below link</h1>
        <a href='http://${process.env.HOST}:${process.env.PORT}/user/changePassword/${token}'>
        Click Here to Verify
        </a>
        `,
  };

  try {
    transporter
      .sendMail(mailOptions)
      .then(() => {
        return res.status(200).json({
          Message:
            "to change password a link has been sent to your email! please check",
        });
      })
      .catch((e) => {
        return res.status(404).json({ Message: "Something Went Wrong" });
      });
  } catch (e) {
    throw new Error(e);
  }
});

const changePassword = asyncHandler(async (req, res) => {
  // get token
  const token = req.params.token;
  // no token
  if (!token) {
    res.status(401);
    throw new Error("Not authorized! no token");
  }

  // token exists
  const tokenVerified = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // tempered token
  if (!tokenVerified) {
    res.status(403);
    throw new Error("Invalid or expired token");
  }

  const { email, hashedPassword } = tokenVerified;

  // check if user alread exists
  const existUser = await UserModel.updateOne(
    { email: email },
    { $set: { password: hashedPassword } }
  );

  // generate new token
  const newToken = jwt.sign({ id: existUser._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  res
    .status(201)
    .json({ successMsg: "Pasword changed Successfully!"});
});

// CURRENT User
const currentUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.body.id).select("-password");

  res.json({
    user,
  });
});
// Get All Users
const getAllUsers = asyncHandler(async (req, res) => {
  const Users = await UserModel.find().select("-password");

  res.json({
    Users,
  });
});
// Remove an User
const removeUser = asyncHandler(async (req, res) => {
  await UserModel.findOneAndDelete({ _id: req.body.id })
    .then(() => {
      res.status(200).json({
        message: "User Removed Successfully",
      });
    })
    .catch((e) => {
      throw new Error("Something went wrong");
    });
});

//add to cart items
const addToWishList = asyncHandler(async (req, res) => {
  const { productId, userId } = req.body;
  if (!userId) {
    throw new Error("Something Went Wrong session Out");
  }
  let data = {
    productId: productId,
  };
  const User = await UserModel.findById(userId);
  User.likes.push(data);
  await User.save();
  res.status(200).json({
    success: true,
  });
});

//add to cart items
const addToCart = asyncHandler(async (req, res) => {
  const { productId, userId } = req.body;
  if (!userId) {
    throw new Error("Something Went Wrong session Out");
  }
  let data = {
    productId: productId,
  };
  const User = await UserModel.findById(userId);
  User.cartItems.push(data);
  await User.save();
  res.status(200).json({
    success: true,
  });
});

// Get all liked products
const likedProducts = asyncHandler(async (req, res, next) => {
  const resp = req.resp;
  let products = [];

  if (resp.success) {
    const User = await UserModel.findById(resp.userId);
    const likes = User.likes;
    for (let i = 0; i < likes.length; i++) {
      let product = await ProductModel.findOne({ _id: likes[i].productId });
      products.push(product);
    }
    if (products.length <= 0) {
      resp.success = false;
      resp.message = "There are not any products in your wishlist currently";
      req.resp = resp;
    } else {
      resp.success = true;
      resp.message = "Success";
      resp.user = User;
      resp.products = products;
      req.resp = resp;
    }
  } else {
    req.resp = resp;
  }
  next();
});

// Get all cart items
const cartItems = asyncHandler(async (req, res, next) => {
  const resp = req.resp;
  let products = [];

  if (resp.success) {
    const User = await UserModel.findById(resp.userId);
    const cartItems = User.cartItems;
    for (let i = 0; i < cartItems.length; i++) {
      let product = await ProductModel.findOne({ _id: cartItems[i].productId });
      products.push(product);
    }
    if (products.length <= 0) {
      resp.success = false;
      resp.message = "There are not any products in your cart currently";
      req.resp = resp;
    } else {
      resp.success = true;
      resp.message = "Success";
      resp.user = User;
      resp.products = products;
      req.resp = resp;
    }
  } else {
    req.resp = resp;
  }
  next();
});

// remove from WishList
const RemoveFromWishList = asyncHandler(async (req, res) => {
  const { productId, userId } = req.body;
  if (!userId) {
    throw new Error("Something Went Wrong session Out");
  }

  const User = await UserModel.findById(userId);
  const indexOfObject = User.likes.findIndex((object) => {
    return object.productId == productId;
  });
  User.likes.splice(indexOfObject, 1);
  await User.save();
  res.status(200).json({
    success: true,
  });
});

// Remove From Cart
const RemoveFromCart = asyncHandler(async (req, res) => {
  const { productId, userId } = req.body;
  if (!userId) {
    throw new Error("Something Went Wrong session Out");
  }

  const User = await UserModel.findById(userId);
  const indexOfObject = User.cartItems.findIndex((object) => {
    return object.productId == productId;
  });
  User.cartItems.splice(indexOfObject, 1);
  await User.save();
  res.status(200).json({
    success: true,
  });
});

module.exports = {
  signUpUser,
  activateAccount,
  signInUser,
  verifyEmail,

  currentUser,
  getAllUsers,
  removeUser,

  forgotPassword,
  changePassword,

  updateProfilePic,
  updateProfile,

  addToWishList,
  likedProducts,

  addToCart,
  cartItems,

  RemoveFromWishList,
  RemoveFromCart,
};
