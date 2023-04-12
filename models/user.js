const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    
   
  });

  //denna ger oss ett unike username och password som läggs in i vårt schema
  UserSchema.plugin(passportLocalMongoose);

 module.exports = mongoose.model('User', UserSchema);