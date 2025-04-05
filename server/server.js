const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));


// Middleware for Express
app.use(express.json()); // Enable JSON data parsing
app.use(express.urlencoded({ extended: true })); // Enable URL-encoded body parsing


// Session Middleware (Required for Passport)
app.use(session({
    secret: process.env.JWT_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true
}));


app.use(passport.initialize());
app.use(passport.session());


// MongoDB User Schema
const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    username: { type: String, required: true }
});


const User = mongoose.model('User', userSchema);


// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const existingUser = await User.findOne({ googleId: profile.id });


        if (existingUser) {
            return done(null, existingUser);
        }


        const newUser = new User({
            googleId: profile.id,
            username: profile.displayName
        });


        await newUser.save();
        return done(null, newUser);
    } catch (error) {
        console.error('❌ Error saving user:', error);
        return done(error, null);
    }
}));


passport.serializeUser((user, done) => {
    done(null, user.id); // Storing only the user ID in the session
});


passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); // Retrieves the full user data from MongoDB
    } catch (error) {
        done(error, null);
    }
});


// Google OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user.id, username: req.user.username },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1h' }
        );

        // Send an HTML page that will safely communicate with the extension
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Success</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f8f9fa;
                    }
                    .message {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="message">
                    <h2>Authentication Successful!</h2>
                    <p>You can close this window and return to the extension.</p>
                </div>
                <script>
                    // Send token to extension
                    const token = "${token}";
                    chrome.runtime.sendMessage("${process.env.EXTENSION_ID}", { token }, 
                        function(response) {
                            if (chrome.runtime.lastError) {
                                console.log("Error sending message:", chrome.runtime.lastError);
                            } else {
                                console.log("Message sent successfully");
                            }
                            // Close the window after a short delay
                            setTimeout(() => window.close(), 2000);
                        }
                    );
                </script>
            </body>
            </html>
        `);
    }
);




// Root Route for Testing (Optional)
app.get('/', (req, res) => {
    res.send('✅ Server is running successfully!');
});


// Start the Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
