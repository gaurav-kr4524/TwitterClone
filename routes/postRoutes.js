const express = require('express');
const app = express();
const router = express.Router(); 
const bodyParser = require("body-parser");
const bcrpyt = require("bcrypt");
const User = require('../schemas/UserSchema');

// page post always have a id
router.get("/:id" , (req,res,next)=>{

    var payload = {
        pageTitle : "View post",
        userLoggedIn : req.session.user,
        userLoggedInJs : JSON.stringify(req.session.user),
        postId: req.params.id
    }
    // The req.params property is an object containing properties mapped to the named route “parameters”, the “id” property is available as req.params.id
    // In order to pass data between pages and calls you have to stringify(takes object and convert it into string) the data
    res.status(200).render("postPage" , payload);
})



module.exports = router;