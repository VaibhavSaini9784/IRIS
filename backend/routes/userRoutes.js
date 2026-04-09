const express = require("express");
const router = express.Router();

// ✅ Import BOTH functions correctly
const { createUser, markAttendance, changePassword } = require("../controllers/userController");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ✅ Routes
router.post("/login", createUser);
router.post("/mark-attendance", upload.single("image"), markAttendance);
router.post("/change-password", changePassword);

module.exports = router;