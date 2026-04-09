const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Log requests with more detail
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});


// MongoDB connect (Dynamic based on .env)
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err.message));
} else {
    // Mock DB mode enabled (no mongoose required)
    console.log("⚠️ Starting in Mock DB mode (Add MONGO_URI to .env to switch to real DB)");
}

// 🔥 Routes use karo
app.use("/api", userRoutes);
app.use("/api", teamRoutes);

// Global Error Handler (Ensures all errors return JSON instead of HTML)
app.use((err, req, res, next) => {
    console.error("❌ GLOBAL ERROR:", err.message);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        path: req.url
    });
});

const PORT = 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});