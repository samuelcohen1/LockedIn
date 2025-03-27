const { GoogleGenerativeAI } = require("@google/generative-ai");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware (Required for Passport)
app.use(
  session({
    secret: process.env.JWT_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// MongoDB User Schema
const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  activity: [
    {
      url: String,
      title: String,
      classification: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const User = mongoose.model("User", userSchema);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("❌ Error saving user:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth-success?token=${token}`);
  }
);

// ✅ FIXED: Correct Gemini API Proxy
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const fetch = require("node-fetch"); // Ensure node-fetch is installed: npm install node-fetch

app.post("/api/gemini", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const geminiResponse = result.response.text();

    res.json({ geminiResponse });
    // res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Route for analyzing tab and storing activity by userID (no JWT)
app.post("/api/analyze-tab", async (req, res) => {
  const { url, title, userID } = req.body;

  if (!url || !title || !userID) {
    return res.status(400).json({ error: "Missing URL, title, or userID." });
  }

  const prompt = `A student is trying to stay productive while studying. They visit a website titled "${title}" at ${url}. Is this website productive, neutral, or unproductive? Respond with only one word and no new lines.`;

  try {
    // use Gemini API call
    const geminiRes = await fetch("http://localhost:3000/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    const { geminiResponse } = await geminiRes.json();

    // Find user and add to activity to Mongo
    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.activity.push({
      url,
      title,
      classification: geminiResponse,
      timestamp: new Date(),
    });

    await user.save();

    res.json({ classification: geminiResponse });
  } catch (err) {
    console.error("Error in /api/analyze-tab:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Root Route
app.get("/", (req, res) => {
  res.send("✅ Server is running successfully!");
});

// Start Server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
