const mongoose = require("mongoose");
const assignSchema = new mongoose.Schema({
    teacher_id :String ,
    student_id : String  ,
    title : String,
    description :String,
    due_date : Date,
    Status : String,
})
const Assign = mongoose.model(assignment , assignSchema);
module.exports = Assign;