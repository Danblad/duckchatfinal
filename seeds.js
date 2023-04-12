const mongoose = require('mongoose');
const Chatroom = require('./models/chatroom');

mongoose.connect('mongodb+srv://krifors:LKWsNIAMvoOC5Jeq@duckchat.blafzko.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log('mongo connection open!')
})
.catch(err => {
    console.log('oh no mongo connection error!!')
    console.log(err)
});

const chatroomList = [
    {
        name: 'tågtrafikchat'
    },
    {
        name: 'funChat'
    }
]

Chatroom.insertMany(chatroomList)
.then(res => {
    console.log(res)
})
.catch(err => {
    console.log(err)
})