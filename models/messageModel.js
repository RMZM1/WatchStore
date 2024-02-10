const mongoose = require("mongoose");
const { Schema } = mongoose;
const MessageSchema = new Schema(
  {
    contactName: {
      type: String,
      maxLength: 64,
      required: true,
    },
    contactEmail: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    contactSubject: {
      type: String,
      required: true,
    },
    contactMessage: {
      type: String,
      required: true,
    },
    messageStatus: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
