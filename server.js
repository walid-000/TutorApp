const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const path = require('path');
require('dotenv').config();
const app = express();
const port = 3000;
const Student = require("./models/student")
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser")
// connection

mongoose.connect("mongodb://127.0.0.1:27017/tutorApp")
    .then(()=> {
        console.log("db connected")
    })

    .catch(err => console.log("error" , err))




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())



// Serve static files from the 'views' directory
app.use(express.static(path.join(__dirname, 'views')));

// Serve the splash.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'splash.html'));
});


app.post('/api/students', async (req, res) => {
    try {
        const email = req.body.email ;
        const existingUser = await Student.findOne({ email: email });
        if (existingUser) {
            console.log("User already exists");
            return res.send("user exist")
        }
        const student = new Student(req.body);
        await student.save();
        // res.status(201).json({message : "succesfully created user"});
        res.redirect("/login.html")
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post("/api/login" , async(req , res)=>{
    try {
    const { role, email, password } = req.body;
    console.log(role);
    if (role === 'student') {
        const user = await Student.findOne({email : email});
        console.log(user)
        if(!user){
            return res.send('No such user');
           }
           if (user.password === password){
            
            
            
            const token = jwt.sign({username : user.name , role : "student"} , "thisIsMySecretKey" , {expiresIn : '1hr'});
            res.cookie("authToken" , token);
    
            
           return  res.redirect("/main.html")
    
           }
        // res.send('Logged in as Student');
    } else if (role === 'teacher') {
        // Handle teacher login
        res.send('Logged in as Teacher');
    } 
}
catch(error){

}

})


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
