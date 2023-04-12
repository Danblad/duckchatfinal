const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const session = require("express-session");
const flash = require("connect-flash");
let socket = require("socket.io");
const { isLoggedIn } = require("./middleware");
const { isAdmin } = require("./middleware");
const Chatroom = require("./models/chatroom");
const Post = require("./models/post");
const Broadcast = require("./models/broadcast");
const Chat = require("./models/chat");
const methodOverride = require("method-override");
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");

//static files
app.use(express.static("views"));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // Solves the MIME-issue

// Connects to the database
mongoose
  .connect(
    "mongodb+srv://krifors:LKWsNIAMvoOC5Jeq@duckchat.blafzko.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("mongo connection open!");
  })
  .catch((err) => {
    console.log("oh no mongo connection error!!");
    console.log(err);
  });

// Sets EJS as our view engine and joins all the paths in views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));


// Gives parameters for the session
const sessionOptions = {
  secret: "Penguinsarethebestandyouaredumbifyoudontthinkso",
  resave: false,
  saveUninitialized: false,
};

// Starts the session
app.use(session(sessionOptions));

app.use(flash());

// Starts the autentication process with session
app.use(passport.session());

app.use(passport.initialize());

// We tell passport to use Localstrategy to authenticate the user
passport.use(new LocalStrategy(User.authenticate()));

// Generates a JWT-token for each user
function generateToken(user) {
  const payload = { userId: user._id };
  const secret = 'Penguinsarethebestandyouaredumbifyoudontthinkso'; // replace with your own secret key
  const options = { expiresIn: '20m' }; // token will expire in the amount of time given
  return jwt.sign(payload, secret, options);
}

// Flash?
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

//These methods comes from mongooselocal
//How to store data in a session hur spara vi data i en session
passport.serializeUser(User.serializeUser());
//how to "un-store" data in a session
passport.deserializeUser(User.deserializeUser());

// Renders the functioning socket chat
app.get("/", (req, res) => {
  res.render("chat");
});

// Renders route to register a user
app.get("/register", (req, res) => {
  res.render("register");
});

// We save the data given from a new user and adds it to the database and then redirects to the login site

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username });
  await User.register(user, password);
  res.redirect("/login");
});

// Renders the login site
app.get("/login", (req, res) => {
  res.render("login");
});

// When we log in, we create a JWT-token to the user and redirects to /channel. Saves the JWT-token as a cookie
app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  async (req, res) => {
    const token = generateToken(req.user);
    res.cookie('jwt', token, { httpOnly: true }); // Sets the token as a cookie
    res.redirect("/ducks/api/channel");
  }
);

// Verifies that the JWT-token is the same as the one it was given and also checks the secret key
// If this doesn't match, we send back that the token is invalid. If no token is received, we send back that message
function verifyToken(req, res, next) {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, 'Penguinsarethebestandyouaredumbifyoudontthinkso', (err, decodedToken) => {
      if (err) {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        req.userId = decodedToken.userId;
        next();
      }
    });
  } else {
    res.status(401).json({ error: 'No token provided' });
  }
}

// Gets the data from all channels. Verifies that the token is correct as well and also sends the data back as JSON. Renders start
app.get("/ducks/api/channel/", verifyToken, async (req, res) => {
  try {
    if(req.headers["accept"] == "application/json"){
    const chatrooms = await Chatroom.find({});
    res.status(200).json(chatrooms);
    }else{
      const chatrooms = await Chatroom.find({});
    console.log(chatrooms);
    res.render("start", { chatrooms });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Renders the new chatroom if the token is accepted, otherwise you're redirected back to the login page
app.get("/ducks/api/channel/new", verifyToken, (req, res) => {
  if (verifyToken) {
    res.render("newChatroom");
  } else {
    res.redirect("/login");
  }
});

// Creates a new chatroom that gets a new id. If the name is taken the response is 409. 
// Otherwise you're redirected to the newly created chat room
app.put("/ducks/api/channel", verifyToken, async (req, res) => {
  try {
    const existingChatroom = await Chatroom.findOne({
      name: req.body.chatroom.name,
    });
    if (!existingChatroom) {
      console.log(req.body.chatroom.name);
      const chatroom = new Chatroom(req.body.chatroom);
      console.log(chatroom);
      console.log(req.headers);
      await chatroom.save();
      if (req.headers["accept"] == "application/json") {
        res.sendStatus(201);
      } else {
        res.redirect(`/ducks/api/channel/${chatroom._id}`);
      }
    } else {
      console.log("Chatroom with this name already exists.");
      return res.status(409).send("Chatroom with this name already exists.");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
});

// Renders the selected chat room and collects the data from that chat room along with the data from broadcast
app.get('/ducks/api/channel/:id', verifyToken, async (req, res) => {
  const broadcasts = await Broadcast.find({});
  const chatroom = await Chatroom.findById(req.params.id);
  const posts = await Post.find({ _id: chatroom.posts });
  if(req.headers["accept"] == "application/json"){
    res.status(200).json({chatroom, broadcasts, posts});
  }else{
    res.render("showChat", { chatroom, posts, broadcasts });
  }
})

// Collects the id from the chat room, accepts new data and pushes it to the database
app.post("/ducks/api/channel/:id", verifyToken, async (req, res) => {
  const chatroomId = req.params.id;
  const newPost = req.body;
  try {
    const post = await Post.create(newPost);
    const chatroom = await Chatroom.findById(chatroomId);
    chatroom.posts.push(post._id);
    await chatroom.save();
    if(req.headers["accept"] == "application/json"){
      res.status(200).send('created new post')
    }else{
    res.redirect(`/ducks/api/channel/${chatroom._id}`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating new post");
  }
});

// Enables you to delete a created chat room, if you're verified and set as an admin. Otherwise you're rejected that possibility
app.delete('/ducks/api/channel/:id', [verifyToken, isAdmin],async(req, res) => {
    const { id } = req.params;
    await Chatroom.findByIdAndDelete(id);
    if(req.headers["accept"] == "application/json"){
      res.status(200).send('deleted chatroom')
    }else{
      res.redirect("/ducks/api/channel");
    }
})

// Logs out the user and redirects him to the log in page
app.get("/logout", (req, res) => {
  req.logout(function () {
    res.redirect("/login");
  });
});

// Allows the verified admin to enter the broadcast page and finds all broadcasts
app.get("/ducks/api/broadcast", [verifyToken, isAdmin], async (req, res) => {
  const broadcasts = await Broadcast.find({});
  if (req.headers["accept"] == "application/json") {
    res.status(200).send(broadcasts)
  }else{
    res.render("broadcast", { broadcasts });
  }
});

// If verified admin, you can post a new broadcast that pushes that data to all existing chat rooms
app.post("/ducks/api/broadcast", [verifyToken, isAdmin], async (req, res) => {
  const newPost = req.body;
  const post = await Post.create(newPost);
  const broadcast = await Broadcast.create(newPost);
  broadcast.posts.push(post._id);
  await broadcast.save();
  if(req.headers["accept"] == "application/json"){
    res.status(200).send('created broadcast')
  }else{
  res.redirect("/ducks/api/broadcast");
  }
});

// Tells the terminal that everything works just fine
const server = app.listen(3000, function () {
  console.log("listening for requests on port 3000,");
});


// This is where we tried to use sockets
// Socket setup & pass server
let io = socket(server);

io.on("connection", function (socket) {
  console.log("made socket connection", socket.id);
  Chat.find({}, function (err, messages) {
    if (err) {
      console.error(err);
      return;
    }
    socket.emit("allMessages", messages);
  });

  //här tas all data från frontend och skickas till ALLA sockets
  //servern säger när jag hör that chatmessage kör jag denna function
  //2
  socket.on("chat", function (data) {
    io.sockets.emit("chat", data);
    const chat = new Chat({
      handle: data.handle,
      message: data.message,
    });
    chat.save((err) => {
      if (err) {
        console.error(err);
      }
    });
  });
  //här tar vi emot typing infon och broadcastar till alla sockets förutom den som skrev
  socket.on("typing", function (data) {
    socket.broadcast.emit("typing", data);
  });
});

//local mongoose plug in har methoden user.register

//för att kolla om någon är inloggad får man automatiskt med
//isAuthenticate med från passport.

//LKWsNIAMvoOC5Jeq password for db mongo
