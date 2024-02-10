const express = require('express')
const bodyParser = require('body-parser');
const CartRouter = express.Router();
const UserCtrl = require('../controllers/CartController');



CartRouter.use(bodyParser.urlencoded({extended:false}));


CartRouter.post('/addToCart', UserCtrl.addToCart);
CartRouter.get('/cartItems', UserCtrl.cartItems);

module.exports = {
    CartRouter
}