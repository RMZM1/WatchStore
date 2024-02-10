// nodemailer
const nodemailer = require("nodemailer");
const path = require("path");
// import .env file
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

let transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.Email,
    pass: process.env.EmailAppPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
