const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
   
    username: {
        type: String
    },
    message: {
        type: String
    }
})

const Post = mongoose.model('Post', postSchema);

module.exports = Post;