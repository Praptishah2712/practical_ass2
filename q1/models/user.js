// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  files: [{ type: String }] // Array to store file paths
});

module.exports = mongoose.model('User', userSchema);
