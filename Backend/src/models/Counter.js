const mongoose = require('mongoose');
// Auto-increment counter used to build report ids
const counterSchema = new mongoose.Schema({
    // One row per sequence, e.g. "report"
    name:{
        type:String,
        required:true,
        unique:true,
    },
    // Last number handed out, bumped with findOneAndUpdate
    sequence:{
        type:Number,
        required:true,
        default:0
    }
},{timestamps:true})

module.exports = mongoose.model("Counter", counterSchema);
