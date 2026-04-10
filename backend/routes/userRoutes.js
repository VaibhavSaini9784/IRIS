const express = require("express");
const router = express.Router();

const { loginUser, markAttendance, changePassword } = require("../controllers/userController");

const multer = require("multer");

// ✅ Memory Storage - no dependency on uploads/ folder
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Routes
router.post("/login", loginUser);
router.post("/mark-attendance", upload.single("image"), markAttendance);
router.post("/change-password", changePassword);

module.exports = router;