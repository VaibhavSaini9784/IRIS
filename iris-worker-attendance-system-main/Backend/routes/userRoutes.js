const express = require("express");
const router = express.Router();

// ✅ Import BOTH functions correctly
const { createUser, markAttendance } = require("../controllers/userController");

const multer = require("multer");

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// ✅ Routes
router.post("/login", createUser);
router.post("/mark-attendance", upload.single("image"), markAttendance);

module.exports = router;