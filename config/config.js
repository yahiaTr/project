const mongoose = require("mongoose");

const ConnectDB = async() => {
    try{
        await mongoose.connect("mongodb+srv://tryahiamo99:<6kWEnVzs4tv7cezP>@cluster0.yb7xz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log("connected to mongoDB");

    }catch(error){
        console.log("failed to connect to mongoDB");
        console.log("..............................................");
        console.log(error);
    }
}


module.exports = ConnectDB;