const mongoose = require("mongoose");
var mongoURL = 'mongodb+srv://pradhanprabhu28:rg5r5J8CNDGKYAEi@cluster0.aosy7.mongodb.net/'
const prot=5000;
mongoose.connect(mongoURL, {useUnifiedTopology : true , useNewUrlParser:true})
        .then(()=>{
            app.listen(prot,()=>{
                console.log("conneced sucessfull")
            })
        }
    )
    .catch((err)=>console.log(err))

// var connection = mongoose.connection

// connection.on('error', ()=>{
//     console.log('MongoDB connection failed')
// })

// connection.on('connected successfully',()=>{
//     console.log("MongoDB connected successfully")
// })

module.exports = mongoose 