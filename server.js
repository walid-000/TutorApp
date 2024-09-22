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
const Subject = require('./models/subject');
const http = require('http').Server(app);
const io = require('socket.io')(http);

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
app.use(express.static(path.join(__dirname, 'public')));


// Storage configuration for multer to handle file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Path where files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

app.post('/submit-assignment', upload.single('assignment_file'), (req, res) => {
    try {
        // Form fields
        const assignmentTitle = req.body.assignment_title;
        const submissionNotes = req.body.submission_notes;
        
        // File data
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Simulate successful submission
        return res.status(200).json({ message: 'Assignment submitted successfully!' });
    } catch (error) {
        console.error('Error while submitting assignment:', error);
        return res.status(500).json({ error: 'Failed to submit assignment' });
    }
});



// Serve the splash.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'splash.html'));
});
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle messages from students
    socket.on('studentMessage', (data) => {
        io.emit('teacherReceiveMessage', data); // Send message to the teacher
    });

    // Handle messages from teachers
    socket.on('teacherMessage', (data) => {
        io.emit('studentReceiveMessage', data); // Send message to the students
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
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

app.post("/api/login", async (req, res) => {
    try {
        const { role, email, password } = req.body;
        if (role === 'student') {
            const user = await Student.findOne({ email });
            if (!user || user.password !== password) {
                return res.status(401).send('Invalid credentials');
            }

            const token = jwt.sign({ username: user.name, role: "student" }, "thisIsMySecretKey", { expiresIn: '1hr' });
            res.cookie("authToken", token);
            return res.redirect("/student-Dashboard.html");
        } else if (role === 'teacher') {
            const user = await Teacher.findOne({ email });
            if (!user || user.password !== password) {
                return res.status(401).send('Invalid credentials');
            }

            const token = jwt.sign({ username: user.name, role: "teacher" }, "thisIsMySecretKey", { expiresIn: '1hr' });
            res.cookie("authToken", token);
            return res.redirect("/teacher-Dashboard.html");
        } else {
            return res.status(400).send('Invalid role');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
app.post('/logout', (req, res) => {
    res.clearCookie('authToken'); // Clear the cookie
    res.status(200).json({ message: 'Logged out successfully' });
});

app.post('/register-teacher', upload.fields([{ name: 'certificates', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), async (req, res) => {
    try {
        const { firstName, lastName, email, education, address, subjects } = req.body;

        if (!req.files['certificates'] || !req.files['photo']) {
            return res.status(400).json({ error: 'Certificates and photo are required.' });
        }

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ error: 'Teacher already exists.' });
        }

        const certificatePath = req.files['certificates'][0].path;
        const photoPath = req.files['photo'][0].path;

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

        await newTeacher.save();
        res.status(201).json({ message: 'Teacher registered successfully.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});

// Teacher data API
app.get('/api/teacher/:username', async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ name: req.params.username });
        if (!teacher) {
            return res.status(404).send('Teacher not found');
        }
        res.json({ name: teacher.name, photo: teacher.photo });
    } catch (error) {
        res.status(500).send('Error fetching teacher data');
    }
});

// Messages API
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find({ to: req.user._id });
        res.json(messages);
    } catch (error) {
        res.status(500).send('Error fetching messages');
    }
});
//app.get('/api/messages', authMiddleware, async (req, res) => {
  //  try {
    //    const messages = await Message.find({ to: req.user.username });
      //  res.json(messages);
    //} catch (error) {
      //  res.status(500).send('Error fetching messages');
    //}
//});


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
