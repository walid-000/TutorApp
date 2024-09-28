const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const path = require('path');
require('dotenv').config();
const app = express();
const port = 3000;
const router = express.Router();
const Task = require('./models/Task');
const Student = require("./models/student"); 
const Course = require('./models/course');
const nodemailer = require('nodemailer');
const taskroutes = require('./models/taskroutes');
app.use(taskroutes);
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser")
const multer = require('multer');
const Teacher = require('./models/teacher');
const Subject = require('./models/subject');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { checkAuth , LogRequestMiddlewarefn} = require("./middleware/global")


// connection

mongoose.connect("mongodb://127.0.0.1:27017/tutorApp")
    .then(()=> {
        console.log("db connected")
    })

    .catch(err => console.log("error" , err))




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use( checkAuth)
app.use(LogRequestMiddlewarefn("log.txt"))





app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('Server is up and running!');
});


const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); 
    }
});
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});
mongoose.set('strictPopulate', false);

app.post('/submit-assignment', upload.single('assignment_file'), (req, res) => {
    console.log(req.body); 
    console.log(req.file);
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

    socket.on('studentMessage', (data) => {
        io.emit('teacherReceiveMessage', data);
    });

   
    socket.on('teacherMessage', (data) => {
        io.emit('studentReceiveMessage', data); 
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
         res.status(201).json({message : "succesfully created user"});
        res.redirect("/login.html")
    } catch (error) {
        res.status(400).send(error);
    }
});


app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

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
            console.log(role , email , password)
            const user = await Teacher.findOne({ email });
            console.log("in db :" , user)
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
    res.clearCookie('authToken'); 
    res.status(200).json({ message: 'Logged out successfully' });
});
const bcrypt = require('bcrypt');

app.post('/register-teacher', upload.fields([{ name: 'certificates', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), async (req, res) => {
    console.log(req.body.password); 
    console.log(req.body);  
    console.log(req.files); 
    try {
        const { firstName, lastName, email, education, address, subjects, password } = req.body;

        if (!req.files['certificates'] || !req.files['photo']) {
            return res.status(400).json({ error: 'Certificates and photo are required.' });
        }

        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ error: 'Teacher already exists.' });
        }

        const certificatePath = req.files['certificates'][0].path;
        const photoPath = req.files['photo'][0].path;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);


        const newTeacher = new Teacher({
            firstName,
            lastName,
            email,
            education,
            certificates: certificatePath,
            photo: photoPath,
            address,
            subjects,
            password : password, 
        });

        await newTeacher.save();
        res.status(201).json({ message: 'Teacher registered successfully.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred during registration.' });
        console.error('Error:', error.stack); 
    }
});

app.get('/api/teachers', async (req, res) => {
    const { name } = req.query; 
    try {
        const query = name ? { name: { $regex: name, $options: 'i' } } : {}; 

        console.log('Searching for teachers with query:', query); 

        const teachers = await Teacher.find(query); 
        console.log('Found teachers:', teachers); 

        res.status(200).json(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ message: 'Failed to fetch teachers.' });
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
app.post('/api/courses', async (req, res) => {
    const { name, startDate, endDate } = req.body;

    try {
        
        const existingCourse = await Course.findOne({
            courseName: name,
            $or: [
                { startDate: { $lte: new Date(endDate) } },
                { endDate: { $gte: new Date(startDate) } }
            ]
        });

       
        if (existingCourse) {
            return res.status(400).json({ message: 'A course with this name is already active until ' + existingCourse.endDate });
        }

       
        const newCourse = new Course({
            courseName: name,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });
        
        await newCourse.save();
        //const courses = await Course.find().populate('studentId');
        res.status(201).json({ message: 'Course created successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create course.' });
    }
});


app.get('/api/courses', async (req, res) => {
    const { name } = req.query; 
    try {
        const courses = await Course.find({
            courseName: { $regex: name, $options: 'i' } 
        });
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Failed to fetch courses.' });
    }
});



app.post('/add-student', async (req, res) => {
    const { email, courseName } = req.body;
    console.log(email)
    try {
        
        const student = await Student.findOne({ email });
        if (!student) {
            return res.status(400).json({ message: 'No student with this email in the database.' });
        }

       
        let course = await Course.findOne({ courseName });
        if (!course) {
            
            course = new Course({
                courseName,
                students: [student._id], 
                startDate: new Date(), 
                endDate: new Date() // Set your desired end date
            });
            await course.save(); // Save the new course
            return res.status(200).json({ message: 'Student added to course successfully.' });
        } else {
            
            if (course.students.includes(student._id)) {
                return res.status(400).json({ message: 'Student is already added to this course.' });
            } else {
                
                course.students.push(student._id);
            }
        }

        await course.save(); // Save the updated course
        return res.status(200).json({ message: 'Student added to course successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find(); // Fetch students from the database
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students.' });
    }
});



app.post('/remove-student', async (req, res) => {
    const { id } = req.body; // Student's ObjectId
    console.log(id);

    try {
        // Find the course that has the student
        const course = await Course.findOne({ students: id });

        if (!course) {
            return res.status(404).json({ message: 'Student not found in any course.' });
        }

        // Update the course to remove the studentId
        await Course.updateOne(
            { _id: course._id }, // Find the course by its id
            { $pull: { students: id } } // Remove studentId from the students array
        );

        // Confirm if the student was removed successfully
        const updatedCourse = await Course.findById(course._id);
        const studentExists = updatedCourse.students.includes(id);

        if (studentExists) {
            return res.status(500).json({ message: 'Failed to remove student from the course.' });
        }

        res.status(200).json({ message: 'Student removed from the course.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove student from the course.' });
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
app.get('/students', async (req, res) => {
    try {
        const courses = await Course.find().populate('studentId');
        console.log(courses)
        res.status(200).json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to retrieve students.' });
    }
});
app.post('/assign-task', async (req, res) => {
    console.log('Received task assignment:', req.body);

    const { taskTitle, taskDescription, dueDate } = req.body;

    try {
        
        const newTask = new Task({
            title: taskTitle,
            description: taskDescription,
            dueDate: dueDate,
            
        });

       
        await newTask.save();
        res.json({ message: 'Task assigned successfully!' });
    } catch (error) {
        console.error('Error saving task:', error); 
        console.error('Database error:', error); 
        res.status(500).json({ error, message: 'Error assigning ' });
    }
});
 //assign

// View 
router.get('/view-tasks', async (req, res) => {
    try {
        const tasks = await Task.find().populate('taskTitle').populate('assignedBy');
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks.' });
    }
});

// Edit 
router.post('/edit-task/:taskTitle', async (req, res) => {
    try {
        const updatedTask = await Task.findByTitleAndUpdate(req.params.taskTitle, req.body, { new: true });
        res.status(200).json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: 'Error editing task.' });
    }
});

// Delete 
app.delete('/delete-task', async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Task title is required.' });
    }

    try {
        const result = await Task.deleteOne({ taskTitle: title }); // Adjust to match your schema
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Task not found.' });
        }
        res.status(200).json({ message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Error deleting task.' });
    }
});
// In your routes file (e.g., courseRoutes.js)
app.delete('/api/courses/:name', async (req, res) => {
    const { name } = req.params;

    try {
        const deletedCourse = await Course.findOneAndDelete({ courseName: name });

        if (!deletedCourse) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.status(200).json({ message: 'Course deleted successfully!' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Failed to delete course.' });
    }
});
// In your routes file (e.g., courseRoutes.js)
app.patch('/api/courses/extend/:name', async (req, res) => {
    const { name } = req.params;
    const { newEndDate } = req.body;

    try {
        const updatedCourse = await Course.findOneAndUpdate(
            { courseName: name },
            { endDate: new Date(newEndDate) },
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.status(200).json({ message: 'Course end date extended successfully!' });
    } catch (error) {
        console.error('Error extending course end date:', error);
        res.status(500).json({ message: 'Failed to extend course end date.' });
    }
});


module.exports = router;


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
