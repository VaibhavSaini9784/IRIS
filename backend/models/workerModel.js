const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  aadhaarId: { type: String, required: true, unique: true },
  irisClassLabel: { type: String, required: true }, // The string the ML API returns e.g. "Shrey"
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true }
});

module.exports = mongoose.model("Worker", workerSchema);
