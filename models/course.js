const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    students: [{ // Change this to an array to allow multiple students
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student" // Use the name of your student model
    }],
    courseName: { 
        type: String,
        required: true // Consider making this required
    },
    startDate: { 
        type: Date,
        required: true // Consider making this required
    },
    endDate: { 
        type: Date,
        required: true // Consider making this required
    }
});

module.exports = mongoose.model('Course', courseSchema);
