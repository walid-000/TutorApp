const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    class: { type: String, required: true },
    previousGrade: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String, required: true },
    parentMobileNumber: { type: String },
    address: { type: String, required: true }
});

const Student = mongoose.model('student', studentSchema);

module.exports = Student ;