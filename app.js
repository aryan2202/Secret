//jshint esversion:6
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  mongoose.connect("mongodb://127.0.0.1:27017/newusers");
//   mongoose.set("useCreateIndex", true);



const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    secret : String
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User",userSchema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})
app.get("/secrets",function(req,res){
    User.find({"secret": {$ne: null}}).then(function(foundUser){
        if(foundUser)
        {
            res.render("secrets",{userswithsecrets : foundUser});
        }
    });
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    console.log(req.user);
// Once the user is authenticated and their session gets saved, their user details are saved to req.user.
//   console.log(req.user.id);

  User.findById(req.user.id).then(function(foundUser){
      if (foundUser) {
        foundUser.secret = submittedSecret;
        
        foundUser.save();
        res.redirect("/secrets");
      }
    
  });
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });
    
});

app.post("/register",function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });
});

app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
      });
    
      req.login(user, function(err){
        if (err) {
          console.log(err);
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
    });         
})

app.listen(3000,function(){
    console.log("server is running on 3000 port");
});