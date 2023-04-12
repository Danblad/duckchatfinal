
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  handle: String,
  message: String
});

module.exports = mongoose.model('Message', messageSchema);