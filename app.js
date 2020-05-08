var express                       = require("express");
var app                           = express();
var bodyParser                    = require("body-parser");
var mongoose                      = require("mongoose");
var Blog                          = require("./models/blog.js");
var User                          = require("./models/user.js");
var methodOverride                = require("method-override");
var expressSanitizer              = require('express-sanitizer');
var passport                      = require("passport");
var localStrategy                 = require("passport-local");
var passportLocalMongoose         = require("passport-local-mongoose");

mongoose.connect("mongodb://localhost/my_blog_app", {useUnifiedTopology: true,useNewUrlParser: true,}).then(() => console.log('DB Connected!')).catch(err => {
console.log("DB Connection Error: ");
});

app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
mongoose.set('useFindAndModify', false);

app.use(require("express-session")({
    secret:"My name is Utkarsh",
    resave:false,
    saveUninitialized:false
}));
app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    next();
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/",function(req,res){
    res.redirect("/blogs");
});

app.get("/blogs",function(req,res){
    Blog.find({},function(err,blogs){
        if(err){
            console.log(err);
        }else{
            res.render("index",{blogs:blogs,currentUser:req.user});
        }
    });
});
app.get("/login",function(req,res){
    res.render("login");
});
app.post("/login",passport.authenticate("local",{
    successRedirect: "/blogs",
    failureRedirect: "/login"
    }),function(req,res){
});
app.get("/logout",function(req,res){
    req.logOut();
    // req.flash("success","Successfully Logged Out");
    res.redirect("/blogs");
})
app.get("/register", function(req, res){
    res.render("register"); 
 });
 //handle sign up logic
app.post("/register", function(req, res){
     var newUser = new User({username: req.body.username});
     User.register(newUser, req.body.password, function(err, user){
         if(err){
            // req.flash("error",err.message);
            return res.render("register");
         }
         passport.authenticate("local")(req, res, function(){
            // req.flash("success","Welcome To BlogApp "+ user.username);
            res.redirect("/blogs"); 
         });
     });
 });

app.get("/blogs/new",isLoggedIn, function(req, res){
    res.render("new",{currentUser:req.user});
});


// CREATE ROUTE
app.post("/blogs",isLoggedIn, function(req, res){
    // create blog
    console.log(req.body);
    console.log("===========")
    console.log(req.body);
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            res.render("new");
        } else {
            //then, redirect to the index
            res.redirect("/blogs");
        }
    });
});
app.get("/blogs/:id",function(req,res){
    Blog.findById(req.params.id,function(err,blogs){
        if(err){
            console.log(err);
        }
        else{
            res.render("show",{blogs:blogs,currentUser:req.user});
        }
    });
});

app.get("/blogs/:id/edit",isLoggedIn,function(req,res){
    Blog.findById(req.params.id,function(err,foundBlog){
        if(err){
            console.log(err);
        }
        else{
            res.render("edit",{blog:foundBlog});
        }
    });
});

app.put("/blogs/:id",isLoggedIn,function(req,res){
    req.body.blog.body = req.sanitize(req.body.blog.body)
    Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err,updatedBlog){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/blogs/"+req.params.id);
        }
    });
});

app.delete("/blogs/:id",isLoggedIn, function(req, res){
    //destroy blog
    Blog.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs");
        }
    })
    //redirect somewhere
 });

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("back");
}
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port,function(){
    console.log("App started"+port);
});
