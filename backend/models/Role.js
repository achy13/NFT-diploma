const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  wallet: String,
  role: String
});

module.exports = mongoose.model("Role", roleSchema);
