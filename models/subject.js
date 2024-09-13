const mongoose = require("mongoose");
const subjectSchema = new mongoose.Schema({
    Name : String,
    description : String ,
})
const Sub = mongoose.model("subject", subjectSchema);
module.exports = Sub;