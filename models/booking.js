const mongoose = require("mongoose");
const  bookSchema = new mongoose.Schema({
   student_id : String ,
   teacher_id : String,
   subject_id : String,
   booking_date : Date,
   Status : String,
   booking_address : String,

})
const Booking = mongoose.model("booking",bookSchema);
module.exports = Booking;
