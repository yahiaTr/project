const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const fs = require('fs');
const FormData = require('form-data');  // لاستعمال FormData
const axios = require("axios");
require('dotenv').config();
const cloudinary = require("../config/cloudinary");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

const SignupUser = async(req,res) => {
    const {userName , email , password , passwordC} = req.body;

    const errors = {};
    if (!userName) errors.userName = "userName is required";
    if (!email) errors.email = "email is required";
    if (!password) errors.password = "password is required";
    if(password !== passwordC) errors.passwordC = "passwords do not match";
    
    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

    try{
    
    const existingEmail = await User.findOne({email});

    if(existingEmail) {
       return res.status(400).json({email : "email is registerd"})
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password , salt);

        const newUser = new User({
            userName,
            email,
            password : hashedPassword
        })
    
        await newUser.save();    
        const accessToken = jwt.sign({Id : newUser._id} , "secretKey");

        res.status(200).json({newUser , accessToken});
        
    }catch(error){
        console.log(error);
        res.status(500).json({message : "something went wrong while signning up"})
    }
   
}

const LoginUser = async(req,res) => {
    const {email , password} = req.body;
    const errors = {};
    if (!email) errors.email = "email is required";
    if (!password) errors.password = "password is required";

    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

    try{
    const newUser = await User.findOne({email});
    
    if(!newUser){
       return res.status(400).json({email : "Invaild email or password"});
    }

    const isVaildPassword = await bcrypt.compare(password , newUser.password);

    if(!isVaildPassword){
        return res.status(400).json({password : "Invaild email or password"});
    }

    const accessToken = jwt.sign({Id : newUser._id , role : newUser.role} , "secretKey");
    res.status(200).json({newUser , accessToken});
}catch(error){
    res.status(500).json({message : "something went wrong while logging in"});
}

}

const GetData = async(req,res) => {
    try{
    const user = await User.findById(req.params.id);
    if(!user){
        res.status(400).json({message : "user not Found"})
    }

    res.status(200).json({chats : user.chats , images : user.images});

}catch(error){
    res.status(400).json(error);
}
}

const LoginWithPovider = async(req,res) => {
        const { displayName, email, provider } = req.body;
      
        try {
          // التحقق مما إذا كان المستخدم موجودًا بالفعل
          let user = await User.findOne({ email });
      
          if (!user) {
            user = new User({
              userName : displayName || "Unknown User",
              email,
              isOAuth: true,
              provider,
            });
            await user.save();
          }
      
          res.status(200).json({ message: "User saved successfully", user });
        } catch (error) {
          console.error("Error saving user:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      };

      const SendMessageTOGemini = async (req, res) => {
        try {
            const { message } = req.body; // نأخذ الـ message من الطلب
            
            // التحقق من أن الـ message موجود
            if (!message) {
                return res.status(400).json({ error: "Message is required" });
            }
    
            // إرسال الرسالة إلى Gemini API للحصول على الرد
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: message || "Explain how AI works"
                        }]
                    }]
                }),
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error from Gemini API:", errorText);
                return res.status(response.status).json({ error: errorText });
            }
    
            // الحصول على الرد من Gemini
            const data = await response.json();
    
            // تحقق من محتويات الاستجابة
            console.log('Gemini Response:', data);
    
            // استخراج النص فقط من content (نص الرد الذي نحتاجه لتخزينه)
            const geminiResponse = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
                ? data.candidates[0].content.parts[0].text // نأخذ النص من الـ part الأول في الـ content
                : 'No response generated from Gemini';
    
            // جلب المستخدم حسب الـ userId (من URL)
            const user = await User.findById(req.params.id); 
            if (!user) {
                return res.status(400).json({ error: "User not found" });
            }
    
            // إذا كانت chats غير موجودة، نقوم بإنشائها
            if (!user.chats) {
                user.chats = []; // التأكد من أن chats موجودة
            }
    
            // إضافة الرسالة والرد إلى قائمة المحادثات (تخزين كلا الرسالة والرد في قاعدة البيانات)
            user.chats.push({
                question: message,  // السؤال الذي أرسله المستخدم
                response: geminiResponse  // الرد من Gemini
            });
    
            // حفظ البيانات في قاعدة البيانات
            await user.save();
    
            // الرد للمستخدم
            res.json({
                message: "Chat saved and response generated",
                response: geminiResponse,  // الرد من Gemini
            });
    
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
    
    // const SendMessageToStability = async (req, res) => {
    //     try {
    //         const { prompt } = req.body; // جلب prompt (السؤال)
    //         console.log("Received prompt:", prompt);
    
    //         if (!prompt) {
    //             return res.status(400).json({ error: "Prompt is required" });
    //         }
    
    //         // البحث عن المستخدم في قاعدة البيانات
    //         const user = await User.findById(req.params.id);
    //         console.log("User found:", user);
    
    //         if (!user) {
    //             return res.status(404).json({ error: "User not found" });
    //         }
    
    //         // استدعاء API من Hugging Face
    //         const response = await axios.post(
    //             "https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4",
    //             { inputs: prompt },
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${STABILITY_API_KEY}`,
    //                     "Content-Type": "application/json",
    //                 },
    //                 responseType: "arraybuffer",
    //             }
    //         );
    
    //         console.log("API Response Status:", response.status);
    
    //         if (response.status !== 200) {
    //             console.error("API Error:", response.status, response.data);
    //             return res.status(response.status).json({ error: "Failed to generate image" });
    //         }
    
    //         // إنشاء اسم فريد للصورة بناءً على التوقيت
    //         const imageName = `generated-image-${Date.now()}.png`;
    //         const publicDir = path.join(__dirname, "../public/images");
    //         const imagePath = path.join(publicDir, imageName);
    
    //         console.log("Saving image to:", imagePath);
    
    //         // التأكد من أن مجلد images موجود، وإذا لم يكن موجودًا يتم إنشاؤه
    //         if (!fs.existsSync(publicDir)) {
    //             fs.mkdirSync(publicDir, { recursive: true });
    //         }
    
    //         // حفظ الصورة في المجلد
    //         fs.writeFileSync(imagePath, response.data);
    
    //         // إنشاء رابط الصورة
    //         const imageUrl = `/images/${imageName}`;
    //         console.log("Image URL:", imageUrl);
    
    //         // تحديث بيانات المستخدم بإضافة السؤال والصورة إلى `images`
    //         user.images.push({
    //             question: prompt,
    //             url: imageUrl,
    //         });
    
    //         console.log("Updated user images:", user.images);
    
    //         // حفظ التعديلات في قاعدة البيانات
    //         await user.save();
    //         console.log("User saved successfully!");
    
    //         // إرسال الاستجابة إلى العميل
    //         res.json({
    //             message: "Image generated and saved successfully",
    //             imageUrl: imageUrl,
    //         });
    
    //     } catch (error) {
    //         console.error("Error:", error);
    //         res.status(500).json({ error: error.message });
    //     }
    // };    

const SendMessageToStability = async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("Received prompt:", prompt);

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // البحث عن المستخدم في قاعدة البيانات
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // استدعاء API من Hugging Face
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4",
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${STABILITY_API_KEY}`,
                    "Content-Type": "application/json",
                },
                responseType: "arraybuffer",
            }
        );

        if (response.status !== 200) {
            console.error("API Error:", response.status, response.data);
            return res.status(response.status).json({ error: "Failed to generate image" });
        }

        console.log("Image generated successfully, uploading to Cloudinary...");

        // رفع الصورة إلى Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(response.data);
        });

        const imageUrl = result.secure_url;
        console.log("Image uploaded to Cloudinary:", imageUrl);

        // تحديث بيانات المستخدم بإضافة السؤال والصورة إلى images
        user.images.push({ question: prompt, url: imageUrl });

        await user.save();
        console.log("User updated successfully!");

        res.json({
            message: "Image generated and uploaded successfully",
            imageUrl: imageUrl,
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    SignupUser,
    LoginUser,
    GetData,
    LoginWithPovider,
    SendMessageTOGemini,
    SendMessageToStability
}