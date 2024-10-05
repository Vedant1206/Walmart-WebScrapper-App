const express = require('express');
const router = express.Router();
const passport = require('passport');

const User = require('../models/usermodel')
// Get routes
router.get('/login', (req, res) =>{
    res.render('login')
})

router.get('/signup', (req, res) =>{
    res.render('signup')
})


// Dashboard route
router.get('/dashboard', isAuthenticatedUser, (req, res) => {
    res.render('dashboard', { user: req.user }); // Pass user data to the view if needed
});

// Middleware to check if the user is authenticated
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please login first to access this page');
    res.redirect('/login');
}

//Post routes
router.post('/login', passport.authenticate('local', {
    successRedirect : '/dashboard',
    failureRedirect : '/login',
    failureFlash : 'Invalid email or password. Try again'
}));

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You have been logged out.');
        res.redirect('/login');
    });
});

router.post('/signup', (req, res) => {
    let { name, email, password } = req.body;
    let userData = { 
        name: name, 
        email: email 
    };
    console.log(req.body);
    User.register(userData, password, (err, user) => {
        if (err) {
            req.flash('error_msg', 'ERROR: ' + err);
            res.redirect('/signup');
        }
        passport.authenticate('local')(req, res, () => {
            req.flash('success_msg', 'Account created successfully');
            res.redirect('/login');
        });
    });
});



module.exports = router;