const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    education: {
        type: String,
        required: true
    },
    certificates: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    subjects: {
        type: String,
        required: true
    },
    dateRegistered: {
        type: Date,
        default: Date.now
    }
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
