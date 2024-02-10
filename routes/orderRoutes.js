const express = require("express");
const bodyParser = require("body-parser");
const OrderRouter = express.Router();
const orderCtrl = require("../controllers/OrderController");

OrderRouter.use(bodyParser.urlencoded({ extended: false }));
OrderRouter.use(bodyParser.json({extended: false}));

OrderRouter.post("/newOrder", orderCtrl.newOrder);
OrderRouter.post("/updateOrder", orderCtrl.updateOrder);
OrderRouter.post("/deleteOrder", orderCtrl.deleteOrder);



OrderRouter.post("/getUserOrders", orderCtrl.getUserOrders);
OrderRouter.post("/getOrder", orderCtrl.getOrder);


OrderRouter.get("/getAllOrders", orderCtrl.getAllOrders);





module.exports = OrderRouter;
