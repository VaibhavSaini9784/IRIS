const User = require("../models/userModel");
const { predictIris } = require("../services/mlService");

// ✅ Use ONLY module.exports (no mixing)
const createUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const newUser = new User({ username, password });
    await newUser.save();

    res.json({ message: "User saved successfully" });

  } catch (error) {
    res.status(500).json({ error: "Error saving user" });
  }
};

const markAttendance = async (req, res) => {
    try {
        const imagePath = req.file.path;

        const result = await predictIris(imagePath);

        const { person, confidence } = result;

        if (person === "Unknown") {
            return res.status(400).json({
                message: "User not recognized",
                confidence
            });
        }

        return res.json({
            message: "Attendance marked",
            person,
            confidence
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createUser,
    markAttendance
};