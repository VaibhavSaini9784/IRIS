const express = require("express");
const router = express.Router();
const { createTeam, getTeams, getStats, getReports, getRecentActivity } = require("../controllers/teamController");

router.post("/team", createTeam);
router.get("/teams", getTeams);
router.get("/stats", getStats);
router.get("/reports", getReports);
router.get("/activity", getRecentActivity);

module.exports = router;