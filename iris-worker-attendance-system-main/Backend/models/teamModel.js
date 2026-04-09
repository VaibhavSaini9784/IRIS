const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
  name: String,
  aadhaarId: String,
  panId: String,
  phone: String,
  address: String,
  verified: Boolean
});

const teamSchema = new mongoose.Schema({
  teamName: String,
  workLocation: String,
  workDescription: String,
  supervisor: String,
  workers: [workerSchema]
});

module.exports = mongoose.model("Team", teamSchema);