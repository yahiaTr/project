const express = require("express");
const router = express.Router();
const { SignupUser, LoginUser, SaveChat, SaveImage, GetData, LoginWithPovider, SendMessageTOGemini, SendMessageToStability } = require("../controllers/userControllers");

router.post("/signup" , SignupUser);
router.post("/login" , LoginUser);
router.post("/login-provider" , LoginWithPovider);
router.post("/:id/gemini-chat" , SendMessageTOGemini);
router.post("/:id/stability-chat" , SendMessageToStability)
router.get("/:id/get-data" , GetData);

module.exports = router;

