const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const path = require('path');
require('dotenv').config();
const app = express();
const port = 3000;
// connection

mongoose.connect("mongodb://127.0.0.1:27017/tutorApp")
    .then(()=> {
        console.log("db connected")
    })

    .catch(err => console.log("error" , err))




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Serve static files from the 'views' directory
app.use(express.static(path.join(__dirname, 'views')));

// Serve the splash.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'splash.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
