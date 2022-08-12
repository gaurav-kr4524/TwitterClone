const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser")
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", async (req, res, next) => {

    var searchObj = req.query;                   // searchObj will contain data that's passed in which is {postedBy: profileUserId}

    if(searchObj.isReply !== undefined ){
        var isReply = searchObj.isReply == "true" ;
        searchObj.replyTo = { $exists : isReply} ;
        delete searchObj.isReply;                  // deleting a property from javascript object
    }
    var results = await getPosts(searchObj);
    res.status(200).send(results);
})

// for replying post , getting the post
router.get("/:id", async (req, res, next) => {

    var postId = req.params.id;  // The req.params property is an object containing properties mapped to the named route “parameters”, the “id” property is available as req.params.id
    var postData = await getPosts({_id: postId});
    postData = postData[0];                          // since we are using find and not findone, as it gives an array we get first element 

    var results ={
        postData: postData
    }

    if(postData.replyTo !== undefined){
        results.replyTo = postData.replyTo;
    }

    results.replies = await getPosts({ replyTo: postId});

    res.status(200).send(results);
})


router.post("/", async (req, res, next) => {

    if(!req.body.content) {
        console.log("Content param not sent with request");
        return res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    if(req.body.replyTo){
        postData.replyTo = req.body.replyTo;
    }

    //Used post-schema to create post object
    Post.create(postData)
    .then(async newPost => {
        newPost = await User.populate(newPost, { path: "postedBy" })     //Populating the postedBy field using UserSchema 

        res.status(201).send(newPost);
    })
    .catch(error => {
        console.log(error);  
        res.sendStatus(400);
    })
})

// USED FOR LIKING POST
// here id is a placholder
router.put("/:id/like", async (req, res, next) => {

    var postId = req.params.id;          // retriving the id from url above
    var userId = req.session.user._id;
    var isLiked = req.session.user.likes &&  req.session.user.likes.includes(postId);

    var option = isLiked ? "$pull" : "$addToSet";

    // Insert User like 
    // Mongodb expects the text here to be name of the field , [] allows you to inject variables and use it as option
    // session has the old user object stored there which doesn't have the like 
    // therefore we use new so that find will gives us the newly updated user
    req.session.user = await User.findByIdAndUpdate(userId , { [option] : {likes: postId }} ,{new: true})    
    .catch(error => {
        console.log(error);  
        res.sendStatus(400);
    })

     // Insert Post like
     var post = await Post.findByIdAndUpdate(postId , { [option] : {likes: userId }} ,{new: true})    
     .catch(error => {
         console.log(error);  
         res.sendStatus(400);
     })


    res.status(200).send(post);
})


// USED FOR RETWEETING POST
router.post("/:id/retweet", async (req, res, next) => {

    var postId = req.params.id;          // retriving the id from url above
    var userId = req.session.user._id;
   
    // Try and delete retweet
    var deletedPost = await Post.findOneAndDelete({postedBy: userId , retweetData: postId})
    .catch(error => {
        console.log(error);  
        res.sendStatus(400);
    })

    var option = deletedPost!= null ? "$pull" : "$addToSet";
    var repost  = deletedPost;

    if(repost == null ){

        repost = await Post.create({postedBy: userId , retweetData: postId})
        .catch(error => {
            console.log(error);  
            res.sendStatus(400);
        })
    }

    req.session.user = await User.findByIdAndUpdate(userId , { [option] : {likes: repost._id }} ,{new: true})    
    .catch(error => {
        console.log(error);  
        res.sendStatus(400);
    })

     // Insert Post retweets
     var post = await Post.findByIdAndUpdate(postId , { [option] : {retweetUsers: userId }} ,{new: true})    
     .catch(error => {
         console.log(error);  
         res.sendStatus(400);
     })


    res.status(200).send(post);
})

// USED FOR DELETING POST (status - 202)
router.delete("/:id", (req, res, next) =>{
    Post.findByIdAndDelete(req.params.id)
    .then(()=> res.sendStatus(202))
    .catch(error =>{
        console.log(error);
        res.sendStatus(400);
    })
})

// Refactoring the get post operation
async function getPosts(filter)
{
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")       // it populates the post but we need to populate postedBy value to
    .sort({createdAt :-1})    // sort in descending order of creation
    .catch(error=>{
        console.log(error);
    }) 

    results = await User.populate(results , {path:"replyTo.postedBy"});
    return  await User.populate(results , {path:"retweetData.postedBy"});
    
} 

module.exports = router;