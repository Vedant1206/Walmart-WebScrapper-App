// Import environment variables from the .env file (for things like database passwords)
const dotenv = require('dotenv');

// Import the Express framework
const express = require('express');

// Create an Express app
const app = express();

// Import the path module for handling file paths
const path = require('path');

// Import body-parser to handle form data
const bodyParser = require('body-parser');

// Import mongoose to connect to MongoDB
const mongoose = require('mongoose');

// Import connect-flash for flash messages (temporary messages)
const flash = require('connect-flash');

// Import express-session for handling user sessions
const session = require('express-session');

// Import passport for authentication
const passport = require('passport');

// Import passport-local strategy for user authentication
const localStrategy = require('passport-local').Strategy;


//------------------------------------------------------------------------------


// Import user routes
const userRoutes = require('./routes/users');

// Import the user model
const User = require('./models/usermodel');

// Load environment variables from the config.env file
dotenv.config({ path: './config.env' });


//------------------------------------------------------------------------------


// Connect to MongoDB using credentials from environment variables
mongoose.connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Middleware for managing sessions (keeps track of user data between requests)
app.use(session({
    secret: 'Just a simple login/sign up application', // Session secret key
    resave: true, // Save session even if it wasn't modified
    saveUninitialized: true // Save uninitialized session (session with no data yet)
}));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport to use the local strategy for authentication
passport.use(new localStrategy({ usernameField: 'email' }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to handle flash messages (temporary messages for success or error)
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg'); // Pass success message to views
    res.locals.error_msg = req.flash('error_msg'); // Pass error message to views
    next(); // Proceed to the next middleware
});

// Parse incoming form data (extended: true allows nested objects)
app.use(bodyParser.urlencoded({ extended: true }));

// Use the imported user routes
app.use(userRoutes);

// Set the directory for view templates
app.set('views', path.join(__dirname, 'views'));

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Start the server and listen on the port specified in environment variables
app.listen(process.env.PORT, () => {
    console.log('Server has started'); // Log message when server is running
});
