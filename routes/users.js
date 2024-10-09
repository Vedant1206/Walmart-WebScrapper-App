const express = require('express');
const router = express.Router();
const passport = require('passport');
require('dotenv').config();

const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const async = require('async');

const User = require('../models/usermodel');
const SMTPTransport = require('nodemailer/lib/smtp-transport');

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

router.get('/forgot', (req, res)=>{
    res.render('forgot')
})
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

// Initialize OAuth2 client with credentials
const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // The Redirect URI
);

oauth2Client.setCredentials({
    refresh_token: '1//0468UtGJkNrlWCgYIARAAGAQSNwF-L9Ir4zjEzvDBoLs7AgpK_3Z1KTbUojR09a7oO9_z1uX4e8O3uLBB8XrE3T3EwnpwDJX2Lmk'
});

// Debugging to ensure credentials are set
console.log('OAuth2 Client Credentials:', oauth2Client.credentials);
// Function to get the access token using the refresh token
async function getAccessToken() {
    try {
        // Request a new access token
        const { token } = await oauth2Client.getAccessToken();
        
        if (!token) {
            throw new Error('Failed to retrieve access token, refresh token might be invalid.');
        }

        console.log('Access Token:', token); // For debugging
        return token;
    } catch (err) {
        console.error('Error fetching access token:', err);
        throw err;
    }
}

// Forgot password route
router.post('/forgot', (req, res, next) => {
    console.log("Request received to send recovery email.");
    
    async.waterfall([
        (done) => {
            console.log("Generating token...");
            crypto.randomBytes(30, (err, buf) => {
                if (err) return done(err);
                const token = buf.toString('hex');
                console.log("Token generated:", token);
                console.log("GMAIL_CLIENT_ID:", process.env.GMAIL_CLIENT_ID);
                console.log("GMAIL_CLIENT_SECRET:", process.env.GMAIL_CLIENT_SECRET);
                console.log("GMAIL_REFRESH_TOKEN:", process.env.GMAIL_REFRESH_TOKEN);
                done(null, token);
            });
        },
        (token, done) => {
            console.log("Searching for user with email:", req.body.email);
            User.findOne({ email: req.body.email })
                .then(user => {
                    if (!user) {
                        req.flash('error_msg', 'User does not exist with this email');
                        return res.redirect('/forgot');
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 1800000; // 30 minutes

                    user.save()
                        .then(() => {
                            console.log("Token saved to user:", token);
                            done(null, token, user);
                        })
                        .catch(err => done(err));
                })
                .catch(err => {
                    console.error("Error finding user:", err);
                    req.flash('error_msg', 'ERROR: ' + err);
                    res.redirect('/forgot');
                });
        },
        async (token, user) => {
            try {
                console.log("Fetching access token...");
                const accessToken = await getAccessToken();  // Get access token
                console.log("Access token fetched:", accessToken);
                
                // Setup nodemailer transport using OAuth2
                const smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        type: 'OAuth2',
                        user: process.env.GMAIL_EMAIL,
                        clientId: process.env.GMAIL_CLIENT_ID,
                        clientSecret: process.env.GMAIL_CLIENT_SECRET,
                        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                        accessToken: accessToken
                    }
                });

                const mailOptions = {
                    to: user.email,
                    from: 'Vedant Pulahru, pulahru.vedant9@gmail.com',
                    subject: 'Recovery Email from Auth Project',
                    text: `Please click the following link to recover your password:\n\n
                    http://${req.headers.host}/reset/${token}\n\n
                    If you did not request this, please ignore this email.`
                };

                console.log("Sending email...");
                smtpTransport.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.error("Error sending email:", err);
                        req.flash('error_msg', 'Error sending email: ' + err);
                        return res.redirect('/forgot');
                    }
                    console.log("Email sent successfully.");
                    req.flash('success_msg', 'Email sent with further instructions. Please check your email.');
                    res.redirect('/forgot');
                });
            } catch (err) {
                console.error("Error in OAuth2:", err);
                req.flash('error_msg', 'Error sending email: ' + err);
                res.redirect('/forgot');
            }
        }
    ], (err) => {
        if (err) {
            console.error("Error in async waterfall:", err);
            res.redirect('/forgot');
        }
    });
});

module.exports = router;