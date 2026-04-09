const Team = require("../models/teamModel");

exports.createTeam = async (req, res) => {
  try {
    const { teamName, workLocation, workDescription, supervisor, workers } = req.body;

    const newTeam = new Team({
      teamName,
      workLocation,
      workDescription,
      supervisor,
      workers
    });

    await newTeam.save();

    res.json({ message: "Team saved successfully" });

  } catch (error) {
    res.status(500).json({ error: "Error saving team" });
  }
};