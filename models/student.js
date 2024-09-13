const mongoose = require("mongoose");
const studSchema = new mongoose.Schema({
    Name : String,
    class : String,
    mobile_numb : String,
    address : String,

})
const Student = mongoose.model("student", studSchema);
module.exports = Student;