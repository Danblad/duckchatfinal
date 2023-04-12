const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatroomSchema = new mongoose.Schema({
    name: {
        type: String
    }
    ,
    posts: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
      },
   
   
})

/*
//lagt till
chatroomSchema.post('save', async function (doc, next) {
  const collectionName = `chatroom_${doc._id}`;
  try {
    // create a new mongoose model with a unique collection name
    const ChatroomModel = mongoose.model(collectionName, new Schema({
      username: String,
      message: String
      // add post properties here
    }));
    // assign the model to the chatroom document
    doc.model = ChatroomModel;
    // continue saving the chatroom document
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
});
*/
const Chatroom = mongoose.model('Chatroom', chatroomSchema);

module.exports = Chatroom;