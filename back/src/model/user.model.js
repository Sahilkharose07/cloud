
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, 
    },
    password: {
        type: String,
        required: true,
    },
    contact: {
        type: Number,
        required: true,
    },
    refreshToken: {
        type: String,
    },
});

const Users = mongoose.model('User', userSchema);
module.exports = Users;
