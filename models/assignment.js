const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  assignment_title: {
    type: String,
    required: true
  },
  assignment_file: {
    type: String, // Store the file path or URL to the file
    required: true
  },
  submission_notes: {
    type: String,
    default: ''
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the teacher who uploaded the assignment
    ref: 'Teacher',
      },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
