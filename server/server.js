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
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );


        // Send token data to background.js instead of redirecting directly
        res.send(`
            <script>
                chrome.runtime.sendMessage('${process.env.EXTENSION_ID}', { token: '${token}' });
                window.close();
            </script>
        `);
    }
);




// Root Route for Testing (Optional)
app.get('/', (req, res) => {
    res.send('✅ Server is running successfully!');
});


// Start the Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
