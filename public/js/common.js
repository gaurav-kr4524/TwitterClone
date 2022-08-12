$("#postTextarea , #replyTextarea").keyup((event) =>{
    var textbox = $(event.target);
    var value = textbox.val().trim();

    var isModal = textbox.parents(".modal").length == 1 ;               // checking that the textbox has a parent class name modal
    
    var submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if(submitButton.length == 0){
        return alert("No submit button found");
    }

    if(value == ""){
        submitButton.prop("disabled",true);
        return;
    }
    submitButton.prop("disabled",false);
})

$("#submitPostButton ,#submitReplyButton").click(()=>{
    var button = $(event.target);
    var isModal = button.parents(".modal").length == 1 ; 
    var textbox = isModal ? $("#replyTextarea")  : $("#postTextarea");

    var data ={
        content : textbox.val()
    }

    if(isModal){
        var id = button.data().id;
        if(id == null) return alert("Button id is null");
        data.replyTo = id;
    }

    $.post("/api/posts", data ,(postData , status , xhr)=>{

        if(postData.replyTo){
            location.reload();           // loads the page if its a reply
        }
        else{
            var html = createPostHtml(postData);
            $(".postContainer").prepend(html);     // adds at the front
            textbox.val("");                       // removing the intial content of textbox after being posted
            button.prop("disabled",true);          // disabling post button
        } 
    })
})


$("#replyModal").on("show.bs.modal" , (event)=>{
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);            // now we have postId , now we make call to restApi to get post for us
    $("#submitReplyButton").data("id",postId);
    
    $.get("/api/posts/" + postId ,results=>{
        outputPosts(results.postData , $("#originalPostContainer"));
    })  
})

// If there is latency in server request , so as to avoid previous msg data on different post 
$("#replyModal").on("hidden.bs.modal" ,()=>{
    $("#originalPostContainer").html("");
})


$("#deletePostModal").on("show.bs.modal" , (event)=>{
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);            // now we have postId , now we make call to restApi to get post for us
    $("#deletePostButton").data("id", postId);             // Now we are transferring the id of post into button id so we can delete it
})

$("#deletePostButton").click((event)=>{
    var postId = $(event.target).data("id");           // this is the element on which the element was fired on 

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "DELETE" ,                                 
        success: ()=>{
           location.reload();                      // after deleting the post reload the page
        }
    })
})


// attaching the click handler to document itself , now the whole page will listen to clicks on likeButton
// original call will not work as first we load the page and then we load the post so basically the likeButtons are not bascially there
$(document).on("click",".likeButton",(event)=>{
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    
    if(postId === undefined) return;

    // put request , since it dosen't exist we can use it via ajax
    // specifying that it is a put request
    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT" ,                                 
        success: (postData)=>{
            button.find("span").text(postData.likes.length || "" );     // find button with span and update the text of it

            if(postData.likes.includes(userLoggedIn._id)){
                button.addClass("active");
            }
            else{
                button.removeClass("active");
            }
        }
    })
})


$(document).on("click",".retweetButton",(event)=>{
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    
    if(postId === undefined) return;

    // post request because retweeting is bascially creating a new post
    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST" ,                                 
        success: (postData)=>{
            button.find("span").text(postData.retweetUsers.length || "" );     // find button with span and update the text of it

            if(postData.retweetUsers.includes(userLoggedIn._id)){
                button.addClass("active");
            }
            else{
                button.removeClass("active");
            }
        }
    })
})

// Takes you to post page
$(document).on("click",".post",(event)=>{
    var element = $(event.target);
    var postId = getPostIdFromElement(element);

    if(postId !== undefined && !element.is("button")){
        window.location.href = '/posts/'+ postId;                    // takes you to  page defined by window.location.href
    }
})



function getPostIdFromElement(element){
    var isRoot = element.hasClass("post");                                      // Every element has the id post
    var rootElement = isRoot ? element : element.closest(".post");              // .closest is jquery function which go up the tree to find parent with specified selector
    var postId = rootElement.data().id;                                         // .data when called on objects gives its data attributes

    if(postId === undefined) return alert("Post id Undefined");

    return postId;
}

 // we can inject js variables using backtick
function createPostHtml(postData , largeFont = false){

    if(postData == null) return alert("Post object is null");

    var isRetweet = postData.retweetData !== undefined;
    var retweetedBy = isRetweet ? postData.postedBy.username : null;
    postData = isRetweet ? postData.retweetData : postData;

    var postedBy = postData.postedBy;

    if(postedBy._id === undefined){
        return console.log("User object not populated");
    }

    var displayName = postedBy.firstName+" "+postedBy.lastName;
    var timestamp = timeDifference(new Date() , new Date(postData.createdAt));

    var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "";
    var retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" : "";
    var largeFontClass = largeFont ? "largeFont" : "" ;

    var retweetText='';
    if(isRetweet){
        retweetText = `<span>
        <i class='fa-solid fa-retweet'></i>
        Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
        </span>`
    }

    var replyFlag ="";
    if(postData.replyTo && postData.replyTo._id ){

        if(!postData.replyTo._id) {return alert("Reply to is not populated"); }
        else if(!postData.replyTo.postedBy._id) {return alert("PostedBy to is not populated"); }

        var replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class='replyFlag'> Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a> </div>`
    }

    var buttons="";
    if(postData.postedBy._id == userLoggedIn._id){
        buttons = `<button data-id="${postData._id}" data-bs-toggle='modal'  data-bs-target="#deletePostModal"><i class="fa-regular fa-trash-can"></i> </button>`
    }


    return `<div class = 'post ${largeFontClass}' data-id='${postData._id}'>   
                <div class='postActionContainer'>
                    ${retweetText}
                </div>
                <div class = 'mainContentContainer'>
                    <div class = 'userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                    <div class ='postContentContainer'>
                        <div class ='header'>
                            <a href='/profile/${postedBy.username}' class='displayName'>${displayName}</a>
                            <span class='username'>@${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
                            ${buttons}
                        </div>
                        ${replyFlag}
                        <div class ='postBody'>
                            <span>${postData.content}</span>
                        </div>
                        <div class ='postFooter'>
                            <div class='postButtonContainer'>
                                <button data-bs-toggle='modal' data-bs-target='#replyModal'>
                                    <i class='fa-regular fa-comment'></i>
                                </button>
                            </div>
                            <div class='postButtonContainer green'>
                                <button class='retweetButton ${retweetButtonActiveClass}'>
                                    <i class='fa-solid fa-retweet'></i>
                                    <span>${postData.retweetUsers.length || ""}</span>
                                </button>
                            </div>
                            <div class='postButtonContainer red'>
                                <button class ='likeButton ${likeButtonActiveClass}'>
                                    <i class='fa-regular fa-heart'></i>
                                    <span>${postData.likes.length || ""}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div> `;

}

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/1000 < 30) return "Just now";

        return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}

function outputPosts(results , container){
    container.html("");                    // clear contents of container

    // if results is not array convert it into array
    if(!Array.isArray(results)){
        results=  [results];
    }
    results.forEach(results => {
        var html = createPostHtml(results);
        container.append(html);
    });

    if(results.length == 0){
        container.append("<span class='noResults'>Nothing to show.</span>");
    }
}


function outputPostsWithReplies(results , container){
    container.html("");    

    if(results.replyTo !== undefined && results.replyTo._id !== undefined){
        var html = createPostHtml(results.replyTo);
        container.append(html);
    }

    var mainPostHtml = createPostHtml(results.postData , true);
    container.append(mainPostHtml);

    results.replies.forEach(results => {
        var html = createPostHtml(results);
        container.append(html);
    });

}


