const mongoose = require("mongoose");
const uri = "mmongodb+srv://tryahiamo99:<6kWEnVzs4tv7cezP>@cluster0.yb7xz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const ConnectDB = async() => {

    try{
    mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true, // تأكد من أن الاتصال باستخدام SSL
    })

    }catch(error){
        console.log("failed to connect to mongoDB");
        console.log("..............................................");
        console.log(error);
    }
}


module.exports = ConnectDB;