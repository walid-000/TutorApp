const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  assignment_title: {
    type: String,
    required: true
  },
  assignment_file: {
    type: Object, 
    required: true
  },
  submission_notes: {
    type: String,
    default: ''
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
