const express = require("express");
const router = express.Router();

// ✅ Import BOTH functions correctly
const { createUser, markAttendance, changePassword } = require("../controllers/userController");

const multer = require("multer");
// ... storage config ...
const upload = multer({ storage });

// ✅ Routes
router.post("/login", createUser);
router.post("/mark-attendance", upload.single("image"), markAttendance);
router.post("/change-password", changePassword);

module.exports = router;