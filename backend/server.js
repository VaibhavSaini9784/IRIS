const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});