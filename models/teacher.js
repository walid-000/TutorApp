const mongoose = require("mongoose");
const teachSchema = new mongoose.Schema({
    Name : String,
    email : String,
    mobile_num : String,
    education : String,
    subjects : [String] ,
})
const Teacher = mongoose.model("teacher", teachSchema);
module.exports = Teacher;