const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// 🔥 Routes use karo
app.use("/api", userRoutes);
app.use("/api", teamRoutes);

app.listen(4000, () => {
  console.log("Server running on port 4000");
});