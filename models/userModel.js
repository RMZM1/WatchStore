const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;
const UserSchema = new Schema(
  {
    profilePic:{
      type: String,
    },
    profilePicCloudinaryID:{
      type: String,
    },
    fullName: {
      type: String,
      maxLength: 64,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },

    verifiedEmail: {
      type: Boolean,
      default: false,
    },
    address:{
        type: String
    },
    postalCode:{
      type:String,
    },
    likes:[
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        },
    ],
    cartItems:[
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        },
    ],
    Orders:[
        {
            OrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        }
    ]
  },
  { timestamps: true }
);
// Use Bcryptjs to hash Password before saving
UserSchema.pre("save", function (next) {
  var salt = bcrypt.genSaltSync(10);
  if (this.password && this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, salt);
}
  next();
});

module.exports = mongoose.model("User", UserSchema);
