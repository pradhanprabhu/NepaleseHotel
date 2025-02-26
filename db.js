const mongoose = require("mongoose");
 
var mongoURL = "mongodb+srv://pradhanprabhu28:rg5r5J8CNDGKYAEi@cluster0.aosy7.mongodb.net/mern-rooms?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(mongoURL, {useUnifiedtopology : true , useNewUrlParser:true})

var connection = mongoose.connection

connection.on('error',()=>{
    console.log('Mongodb connection failed')
})

connection.on('connected',()=>{
    console.log('Mongodb connection successfull')
}) 

module.exports = mongoose