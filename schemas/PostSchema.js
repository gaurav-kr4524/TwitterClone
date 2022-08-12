const mongoose = require("mongoose");


const Schema = mongoose.Schema;
const PostSchema = new Schema({
    content:{ type: String, trim: true },                            
    postedBy:{ type: Schema.Types.ObjectId , ref: 'User' },         
    pinned : Boolean,
    likes: [{ type: Schema.Types.ObjectId , ref: 'User' }], // array of user objects , all users who liked this post
    retweetUsers: [{ type: Schema.Types.ObjectId , ref: 'User' }],
    retweetData: { type: Schema.Types.ObjectId , ref: 'Post' },
    replyTo: { type: Schema.Types.ObjectId , ref: 'Post' }
},{timestamps:true});

var Post = mongoose.model('Post', PostSchema); // Name of model is Post Here
module.exports = Post;