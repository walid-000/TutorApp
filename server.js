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
const multer = require('multer');
const Teacher = require('./models/teacher');
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

// Storage configuration for multer to handle file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Path where files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

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
// File filter for certificates and photos
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
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
    
            
           return  res.redirect("/student-Dashboard.html")
    
           }
         //res.send('Logged in as Student');
         res.redirect("student-Dashboard.html")
    } else if (role === 'teacher') {
        const user = await Teacher.findOne({email : email});
        console.log(user)
        if(!user){
            return res.send('No such user');
           }
           if (user.password === password){
            
            
            
            const token = jwt.sign({username : user.name , role : "teacher"} , "thisIsMySecretKey" , {expiresIn : '1hr'});
            res.cookie("authToken" , token);
    
            
           return  res.redirect("teacher-Dashboard.html")
    
           }
        //res.send('Logged in as Teacher');
        res.redirect("/teacher-Dashboard.html")
    } 
}
catch(error){

}

})

app.post('/register-teacher', upload.fields([{ name: 'certificates', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), async (req, res) => {
    try {
        // Extracting form data
        const { firstName, lastName, email, education, address, subjects } = req.body;

        // Check if a teacher with the same email already exists
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ error: 'Teacher already exists.' });
        }

        // Extracting file paths
        const certificatePath = req.files['certificates'][0].path;
        const photoPath = req.files['photo'][0].path;

        // Create a new teacher document
        const newTeacher = new Teacher({
            firstName,
            lastName,
            email,
            education,
            certificates: certificatePath,
            photo: photoPath,
            address,
            subjects
        });

        // Save teacher to the database
        await newTeacher.save();

        res.status(201).json({ message: 'Teacher registered successfully.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});
app.post('/add-student', async (req, res) => {
    const { name, email, address } = req.body;

    // Simple validation
    if (!name || !email || !address) {
        return res.status(400).json({ message: 'Please fill in all fields' });
    }

    try {
        // Create new student and save to DB
        const student = new Student({
            name: name,
            email: email,
            address: address
        });

        await student.save();

        res.status(201).json({ message: 'Student added successfully' });
    } catch (error) {
        // Check if student with the same email already exists
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        console.error('Error saving student:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
app.post('/remove-student', (req, res) => {
    const { id } = req.body;

    const index = students.indexOf(id);
    if (index !== -1) {
        students.splice(index, 1);
        res.json({ message: `Removed ${id} successfully!` });
    } else {
        res.status(404).json({ message: 'Student not found!' });
    }
});
app.get('/api/search/teachers', async (req, res) => {
    const query = req.query.q;
    try {
        const teachers = await Teacher.find({ name: { $regex: query, $options: 'i' } });
        res.json(teachers);
    } catch (error) {
        res.status(500).send('Error fetching teachers');
    }
});

app.get('/api/search/subjects', async (req, res) => {
    const query = req.query.q;
    try {
        const subjects = await Subject.find({ name: { $regex: query, $options: 'i' } });
        res.json(subjects);
    } catch (error) {
        res.status(500).send('Error fetching subjects');
    }
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
