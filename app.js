const express = require('express'); // Import the Express framework
const app = express(); // Create an Express app

// Importing libraries
const path = require('path'); // Import the path module for handling file paths
const bodyParser = require('body-parser'); // Import body-parser to handle form data
const dotenv = require('dotenv') // Import dotenv to load environment variables from a .env file

// Load the environment variables from the .env file
dotenv.config();

const mongoose = require('mongoose'); // Import mongoose to connect to MongoDB
const flash = require('connect-flash') // Import connect-flash for flash messages (temporary messages)
const session = require('express-session') // Import express-session for handling user sessions
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

const userRoutes = require('./routes/users'); //require user routes

const User = require('./models/usermodel')

// Load environment variables from the config.env file (for things like database passwords)
dotenv.config({path :'./config.env'});

// Connect to the MongoDB database using credentials from environment variables
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
    secret : 'Just a simple login/sign up application', // This is a key used to encrypt session data for security
    resave: true, // Save session even if it wasn't modified
    saveUninitialized: true //a new session will exist for all users, whether or not they’ve interacted with the session data.
}))


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy({usernameField: 'email'}, User.authenticate()));

// how to serialize (or store) the user data (usually the user ID) into the session when they log in.
passport.serializeUser(User.serializeUser());

// This tells Passport how to deserialize (or retrieve) the user from the session. When a user makes a request, this function retrieves their full user data from the session ID, allowing the application to know who the user is.
passport.deserializeUser(User.deserializeUser());


// Middleware to handle flash messages (temporary messages for success or error)
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
});

// Parse incoming form data (extended: true allows nested objects)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(userRoutes);

app.set('views', path.join(__dirname, 'views')); // Set the directory for view templates
app.set('view engine', 'ejs'); // Set EJS as the template engine


// Start the server and listen on the port specified in environment variables
app.listen(process.env.PORT, ()=>{
    console.log('Server has started') // Log message when server is running
})
