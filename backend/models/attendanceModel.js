const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Refers to the sub-document ID inside Team
  date: { type: Date, default: Date.now },
  confidence: { type: Number, required: true },
  status: { type: String, enum: ["present", "absent", "pending"], default: "present" }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
