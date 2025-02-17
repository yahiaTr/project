const mongoose = require("mongoose");

const ConnectDB = async() => {
    try{
        await mongoose.connect("mongodb://localhost:/aiProject");
        console.log("connected to mongoDB");

    }catch(error){
        console.log("failed to connect to mongoDB");
        console.log("..............................................");
        console.log(error);
    }
}


module.exports = ConnectDB;