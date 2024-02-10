const MessageModel = require("../models/messageModel");
const asyncHandler = require("express-async-handler");


// SIGNUP
const postMSG = asyncHandler(async (req, res) => {
  const { contactName, contactEmail, contactSubject, contactMessage } = req.body;

  if (!contactName || !contactEmail || !contactSubject ||!contactMessage) {
    res.status(400);
    throw new Error("Please include all fields");
  }
  // save admin
  const MSG = new MessageModel({
    contactName,
    contactEmail,
    contactSubject,
    contactMessage,
  });

  await MSG.save();

  if (!MSG) {
    throw new Error("Something went wrong");
  }
  res.status(200).json({Message: "Message sent"})
});

// delete MSG
const deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await MessageModel.findById(req.body.messageId);
  if (!message) {
    res.status(404);
    throw new Error("message is not found or deleted already");
  }

  // delete from MongoDB
  await MessageModel.findOneAndDelete({ _id: req.body.messageId })
    .then(() => {
      res.status(200).json({
        success: true,
        message: "message Deleted Successfully",
      });
    })
    .catch((e) => {
      throw new Error("Something went wrong while deleting from db");
    });
  next();
});



module.exports = {
    postMSG,
    deleteMessage,
}