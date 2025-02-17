const express = require("express");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const ConnectDB = require("./config/config");
require('dotenv').config();
const path = require("path");
const app = express();

app.use(cors());

ConnectDB();
const port = 5000;

// ضروري لقراءة body كـ JSON
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));



// أضف أي Middleware آخر بعده...

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use("/api/users" , userRoutes);

app.listen(port , ()=> {
    console.log(`server is running on port ${port}`);
}) 