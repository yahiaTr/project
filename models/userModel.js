const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    userName : {type : String , trim : true, required : true},
    email : {type : String , unique : true , trim : true, required : true},
    password: { type: String, trim : true },
    chats : [{
        question : {
            type : String ,
            trim : true,
            required : true
        },

        response : {
            type : String ,
            trim : true,
        },
        createdAt: { type: Date, default: Date.now }
    }],
    images : [{
        question : {type : String , trim : true , rerquired : true},
        url : {type : String , required: true, trim: true },
        createdAt : { type: Date, default: Date.now }
    }]
})

const User = mongoose.model("User" , userSchema);

module.exports = User;