const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const broadcastSchema = new mongoose.Schema({
   
    username: {
        type: String
    },
    posts: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
      },
    message: {
        type: String
    }
})

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

module.exports = Broadcast;