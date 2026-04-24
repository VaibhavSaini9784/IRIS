const express = require("express");
const router = express.Router();
const { 
  createTeam, getTeams, getStats, getReports, getRecentActivity, getLabels,
  deleteTeam, addWorker, updateWorker, deleteWorker 
} = require("../controllers/teamController");

router.post("/team", createTeam);
router.get("/teams", getTeams);
router.delete("/teams/:id", deleteTeam);
router.get("/stats", getStats);
router.get("/reports", getReports);
router.get("/activity", getRecentActivity);
router.get("/labels", getLabels);

// Worker CRUD
router.post("/teams/:teamId/workers", addWorker);
router.put("/teams/:teamId/workers/:workerId", updateWorker);
router.delete("/teams/:teamId/workers/:workerId", deleteWorker);

module.exports = router;