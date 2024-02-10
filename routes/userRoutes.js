const express = require('express')
const bodyParser = require('body-parser');
const UserRouter = express.Router()
const upload = require("../config/multer");
const UserCtrl = require('../controllers/UserController')



UserRouter.use(bodyParser.urlencoded({extended:false}));



UserRouter.post('/signUpUser', UserCtrl.signUpUser);
// UserRouter.post('/signInUser', UserCtrl.signInUser);

UserRouter.post('/verifyEmail', UserCtrl.verifyEmail);

UserRouter.post('/removeUser', UserCtrl.removeUser);

UserRouter.post('/forgotPassword', UserCtrl.forgotPassword);

UserRouter.get('/changePassword/:token', UserCtrl.changePassword);
UserRouter.get('/activate/:token', UserCtrl.activateAccount);
UserRouter.get('/currentUser', UserCtrl.currentUser);
UserRouter.get('/getAllUsers', UserCtrl.getAllUsers);


UserRouter.post('/addToWishList', UserCtrl.addToWishList);
UserRouter.get('/likedProducts', UserCtrl.likedProducts);

UserRouter.post('/addToCart', UserCtrl.addToCart);
UserRouter.get('/cartItems', UserCtrl.cartItems);

UserRouter.post('/RemoveFromCart', UserCtrl.RemoveFromCart);
UserRouter.post('/RemoveFromWishList', UserCtrl.RemoveFromWishList);


UserRouter.post("/updateProfile", UserCtrl.updateProfile);

UserRouter.post("/updateProfilePic", upload.single("profilePic"), UserCtrl.updateProfilePic);

module.exports = UserRouter
