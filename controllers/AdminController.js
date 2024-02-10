const AdminModel = require("../models/adminModel");
const bcryptjs = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const transporter = require("../config/nodeMailer");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// import .env file
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

// SIGNUP
const signUpAdmin = asyncHandler(async (req, res, next) => {
  const { fullName, email, password } = req.body;
  const resp = {
    success: false,
    message: "",
  };

  if (!fullName || !email || !password) {
    resp.message = "Please include all fields";
    req.resp = resp;
  }
  // check password length
  else if (password.length < 8) {
    resp.message = "Minimum length should be 8 characters";
    req.resp = resp;
  } else {
    const emailExist = await AdminModel.findOne({ email: email });

    // check if email already exists
    if (emailExist) {
      resp.message = "Email already exists";
      req.resp = resp;
    } else {
      // save admin
      const admin = new AdminModel({
        fullName,
        email,
        password,
        verifiedEmail: false,
      });

      await admin.save();

      if (!admin) {
        resp.message = "Something went wrong";
        req.resp = resp;
      } else {
        resp.success = true;
        resp.message = "Admin Added Successfully";
        req.resp = resp;
      }
    }
  }
  next();
});

// SIGNIN
const signInAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  let resp = {
    success: false,
    message: "",
    Admin: {},
  };

  if (!email || !password) {
    resp.message = "Please include all fields";
    req.resp = resp;
  } else {
    const admin = await AdminModel.findOne({ email: email });

    // check if email do not exists
    if (!admin) {
      resp.message = "Email does'nt exist! Please sign up first";
      req.resp = resp;
    } else {
      let matchPassword = bcryptjs.compareSync(password, admin.password);
      var salt = bcryptjs.genSaltSync(10);
      hashedpassword = bcryptjs.hashSync(password, salt);

      // if passwords do not match
      if (!matchPassword) {
        resp.message = "Incorrect password!";
        req.resp = resp;
      } else {
        // Exclude password
        const adminnn = await AdminModel.findOne({ email: email }).select(
          "-password"
        );
        const newToken = jwt.sign(
          { id: adminnn._id },
          process.env.JWT_SECRET_KEY,
          {
            expiresIn: "1d",
          }
        );

        // check if email is verified than sign in else first verify
        if (admin.verifiedEmail) {
          // sign in admin
          // Store token in cookies
          res.cookie("adminToken", newToken, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), //expires in 1 day
            httpOnly: true,
          });
          resp.success = true;
          resp.Admin = adminnn;
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


// Get email and send Otp to that Email
// verifyEmail
const verifyEmail = asyncHandler(async (req, res) => {
  // Check Email exist or Not
  const adminExist = await AdminModel.findOne({ email: req.body.email });
  if (!adminExist) {
    res.status(400);
    throw new Error("Email does Not exists! please Signup First");
  }

  const adminId = adminExist._id;
  const token = jwt.sign({ adminId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "20m",
  });

  let mailOptions = {
    from: process.env.Email,
    to: req.body.email,
    subject: "Email Activation Link",
    html: `<h1>Please verify your account by clicking below link</h1>
      <a href='http://${process.env.HOST}:${process.env.PORT}/admin/activate/${token}'>
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

  const { adminId } = tokenVerified;

  // check if admin alread exists
  const adminExist = await AdminModel.findById({ _id: adminId });

  // Verify admin Email

  (adminExist.verifiedEmail = true), await adminExist.save();

  if (!adminExist) {
    throw new Error("Something went wrong");
  }
  // generate new token
  const newToken = jwt.sign(
    { id: adminExist._id },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "1d",
    }
  );

  res
    .status(201)
    .json({ successMsg: "Verified Successfully! Now You can Login" });
});

// Change Password
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

  const emailExist = await AdminModel.findOne({ email: email });
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
        <a href='http://${process.env.HOST}:${process.env.PORT}/admin/changePassword/${token}'>
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

  // check if admin alread exists
  const adminExist = await AdminModel.updateOne(
    { email: email },
    { $set: { password: hashedPassword } }
  );

  // generate new token
  const newToken = jwt.sign(
    { id: adminExist._id },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "1d",
    }
  );

  res.status(201).json({ successMsg: "Pasword changed Successfully!" });
});

// CURRENT Admin
const currentadmin = asyncHandler(async (req, res) => {
  const { _id, fullName, email } = await AdminModel.findById(req.body._id);

  res.json({
    id: _id,
    fullName,
    email,
  });
});

// Get All Admins
const getAllAdmins = asyncHandler(async (req, res) => {
  const Admins = await AdminModel.find().select("-password");

  res.json({
    Admins,
  });
});

// Remove an Admin
const removeAdmin = asyncHandler(async (req, res) => {
  await AdminModel.findOneAndDelete({ _id: req.body.adminId })
    .then(() => {
      res.status(200).json({
        success: true,
        message: "Admin Removed Successfully",
      });
    })
    .catch((e) => {
      throw new Error("Something went wrong");
    });
});

module.exports = {
  signUpAdmin,
  signInAdmin,
  currentadmin,
  verifyEmail,
  activateAccount,
  changePassword,
  forgotPassword,
  getAllAdmins,
  removeAdmin,
};
