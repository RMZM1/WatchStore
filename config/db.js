const mongoose = require('mongoose');
const path = require('path');
// import .env file 
require('dotenv').config({
    path: path.join(__dirname, '../.env')
})



const url = `${process.env.MONGODBURL}`;

mongoose.connect(url).then(()=>{console.log('DB connected')}).catch((err)=>{console.log(err)});


module.exports = mongoose;