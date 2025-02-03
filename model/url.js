const mongoose = require('mongoose');

const clickDataSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    count: { type: Number, default: 0 }
});

const osDataSchema = new mongoose.Schema({
    osName: { type: String, required: true },
    uniqueClicks: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 }
});

const deviceDataSchema = new mongoose.Schema({
    deviceName: { type: String, required: true },
    uniqueClicks: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 }
});

const urlSchema = new mongoose.Schema({
    longURL : {
        type : String,
        required : true
    },
    shortURL :{
        type : String,
        required : true,
        unique: true
    },
    appendAlias : {
        type : String,
        required : true
    },
    createdAt :{
        type : Date,
        required : true
    },
    topic : {
        type : String,
        required : true
    },
    redirects: {
        type: Number,
        default: 0 
    },
    uniqueUsers: {
         type: [String], default: []
    },
    clicksByDate: [clickDataSchema],
    osType: [osDataSchema],
    deviceType: [deviceDataSchema]
});

module.exports = mongoose.model('url',urlSchema);