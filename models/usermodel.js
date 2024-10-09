/* 
    This JavaScript file defines a user schema for MongoDB with fields for name, email, and password using Mongoose. It also integrates `passport-local-mongoose` to handle authentication, using the email field for login.
 */

const mongoose = require('mongoose');

// handle user authentication
// plugin that simplifies adding username and password-based authentication to a Mongoose schema
const passportLocalMongoose = require('passport-local-mongoose')

let userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: {
        type: String,

        //dont want to show this password
        // ensures the password isn't retrieved when fetching a user unless explicitly requested
        select: false 
    },
    resetPasswordToken: String, 
    resetPasswordExpires: Date
})

// handling of authentication logic
// use the email field as the "username" for authentication, instead of the default username.
userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});

module.exports = mongoose.model('User', userSchema)