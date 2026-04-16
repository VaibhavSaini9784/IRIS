const express = require("express");
const router = express.Router();
const { createTeam, getTeams, getStats, getReports, getRecentActivity, getLabels } = require("../controllers/teamController");

router.post("/team", createTeam);
router.get("/teams", getTeams);
router.get("/stats", getStats);
router.get("/reports", getReports);
router.get("/activity", getRecentActivity);
router.get("/labels", getLabels);


module.exports = router;