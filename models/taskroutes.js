const express = require('express');
const router = express.Router();

// Route to view tasks
router.get('/view-tasks', (req, res) => {
    res.json([
        { taskTitle: 'Task 1', taskDescription: 'Complete assignment 1', dueDate: '2024-10-11' },
        { taskTitle: 'Task 2', taskDescription: 'Complete assignment 2', dueDate: '2024-10-10' }
    ]);
});

// Add more routes for edit, delete, etc.
module.exports = router;
