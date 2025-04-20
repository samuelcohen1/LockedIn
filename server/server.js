// server.js
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const buildPrompt = require("./prompt");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.JWT_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

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

// JWT Auth Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret",
      (err, user) => {
        if (err)
          return res.status(403).json({ error: "Invalid or expired token" });
        req.user = user;
        next();
      }
    );
  } else {
    res
      .status(401)
      .json({ error: "Authorization header missing or malformed" });
  }
};

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

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Auth Routes
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
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Success</title>
        <style>
          body {
            font-family: sans-serif;
            display: flex; justify-content: center; align-items: center;
            height: 100vh; margin: 0; background-color: #f8f9fa;
          }
          .message {
            background: white; padding: 20px;
            border-radius: 8px; text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="message">
          <h2>Authentication Successful!</h2>
          <p>You can close this window and return to the extension.</p>
        </div>
        <script>
          const token = "${token}";
          chrome.runtime.sendMessage("${process.env.EXTENSION_ID}", { token }, (response) => {
            if (chrome.runtime.lastError) {
              console.log("Error sending message:", chrome.runtime.lastError);
            } else {
              console.log("Message sent successfully");
            }
            setTimeout(() => window.close(), 2000);
          });
        </script>
      </body>
      </html>
    `);
  }
);

// Gemini API Proxy
app.post("/api/gemini", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required." });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const geminiResponse = result.response.text();

    res.json({ geminiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini API error" });
  }
});

// Track Tab Usage (Secured)
app.post("/api/analyze-tab", authenticateJWT, async (req, res) => {
  const { url, title } = req.body;
  const userID = req.user.id;

  if (!url || !title) {
    return res.status(400).json({ error: "Missing URL or title." });
  }

  // const prompt = `A student is trying to stay productive while studying. They visit a website titled "${title}" at ${url}.
  // Is this website productive, neutral, or unproductive? Respond with only one word and no new lines.`;
  const prompt = buildPrompt({ title: title, url: url });

  try {
    const geminiRes = await fetch("http://localhost:3000/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const { geminiResponse } = await geminiRes.json();

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

// Get Tab History (URLs and productivity)
app.get("/api/history", authenticateJWT, async (req, res) => {
  try {
    const userID = req.user.id;
    const user = await User.findById(userID);
    if (!user) return res.status(404).json({ error: "User not found" });
    // Map url and classification fields from each activity object
    const history = (user.activity || [])
      .filter(item => item && item.url)
      .map(item => ({
        url: item.url,
        classification: item.classification
      }));
    res.json({ history });
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("✅ Server is running successfully!");
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
