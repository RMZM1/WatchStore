const express = require("express");
const bodyParser = require("body-parser");
const AdminRouter = express.Router();

const AdminCtrl = require("../controllers/AdminController");

AdminRouter.use(bodyParser.urlencoded({ extended: false }));

AdminRouter.post("/signUpAdmin", AdminCtrl.signUpAdmin);
AdminRouter.post("/signInAdmin", AdminCtrl.signInAdmin);
AdminRouter.post("/verifyEmail", AdminCtrl.verifyEmail);
AdminRouter.post("/changePassword", AdminCtrl.changePassword);
AdminRouter.post("/removeAdmin", AdminCtrl.removeAdmin);
AdminRouter.post('/forgotPassword', AdminCtrl.forgotPassword);
AdminRouter.get('/changePassword/:token', AdminCtrl.changePassword);
AdminRouter.get('/activate/:token', AdminCtrl.activateAccount);

AdminRouter.get("/currentadmin", AdminCtrl.currentadmin);
AdminRouter.get("/getAllAdmins", AdminCtrl.getAllAdmins);

module.exports = AdminRouter;
