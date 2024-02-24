const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;

 

const lessonSchema = new mongoose.Schema({

    lessonName: {

        type: String,

        required: true,

    },

    lastSavedCode: {

        type: String,

        required: true

    },

   
});

 

 const Lesson = mongoose.model('Lesson', lessonSchema);

 module.exports= Lesson;
