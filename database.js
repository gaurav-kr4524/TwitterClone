const mongoose = require("mongoose");

class Database{

    constructor(){
        this.connect();
    }

    connect(){
         mongoose.connect("mongodb+srv://Error_cpp:%40mongodb%40@cluster0.vfhbuuf.mongodb.net/?retryWrites=true&w=majority")
        .then(()=>{
            console.log("Database Connection Successful");
        })
        .catch((err)=>{
            console.log("Database Connection error "+ err);
        })
    }
}

module.exports = new Database();