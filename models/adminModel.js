const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;
const AdminSchema = new Schema(
  {
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
  },
  { timestamps: true }
);
// Use Bcryptjs to hash Password before saving
AdminSchema.pre("save", function (next) {
  var salt = bcrypt.genSaltSync(10);
  if (this.password && this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, salt);
}
  next();
});

module.exports = mongoose.model("Admin", AdminSchema);
