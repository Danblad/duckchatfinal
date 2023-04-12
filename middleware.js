
module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.flash('error', 'you must be signed in');
       return res.status(401).send('you have to login')
    }
    next();
}

module.exports.isAdmin = (req, res, next) => {
   if(req.user && (req.user._id.toString()=== '642d2a9130e66d787e9f29c7')){
    next()
   }else{
    res.send('you are not an admin')
}
};