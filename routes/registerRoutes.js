const express = require('express');
const app = express();
const router = express.Router(); 
const bodyParser = require("body-parser");
const bcrpyt = require("bcrypt");
const User = require('../schemas/UserSchema');

app.set("view engine","pug");
app.set("views","views");

app.use(bodyParser.urlencoded({extended:false}));

router.get("/" , (req,res,next)=>{
    res.status(200).render("register");
})

router.post("/" , async (req,res,next)=>{

    var firstName = req.body.firstName.trim();
    var lastName = req.body.lastName.trim();
    var username = req.body.username.trim();
    var email = req.body.email.trim();
    var password = req.body.password;

    var payload = req.body;

    if(password && lastName && username && email && password)
    {
        var user = await User.findOne({
        $or: [{ username: username },{ email: email }]
    })
    .catch((error)=>{
        console.log(error);

        payload.errorMesssage = "Something went wrong.";
        res.status(200).render("register",payload);
    });

    if(user == null){
        // no user found
        var data = req.body;
        data.password = await bcrpyt.hash(password,10);

        // Used user-Schema to create user object
        User.create(data)
        .then((user)=>{
            req.session.user = user;
            return res.redirect("/");
        })
    }
    else{
        // user found
        if(email == user.email){
            payload.errorMesssage = "Email already in use.";
        }
        else{
            payload.errorMesssage = "Username already in use.";
        }
        res.status(200).render("register",payload);
    }

    }
    else{
        payload.errorMesssage = "Make sure that each field has valid value.";
        res.status(200).render("register",payload);
    }
    
})

module.exports = router;