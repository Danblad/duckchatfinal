
const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
  handle: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Chat', chatSchema);