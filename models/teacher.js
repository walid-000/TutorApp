const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    education: String,
    certificates: String, // Store path to the certificate file
    photo: String, // Store path to the photo file
    address: String,
    subjects: [String]
});

const Teacher = mongoose.model('Teacher', teacherSchema);
module.exports = Teacher;