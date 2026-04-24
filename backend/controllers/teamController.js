const { getData, saveData } = require("../mockDb");
const Team = require("../models/teamModel");
const Attendance = require("../models/attendanceModel");
const { getTrainedLabels } = require("../services/mlService");

exports.createTeam = async (req, res) => {
  try {
    const { teamName, workLocation, workDescription, supervisor, workers } = req.body;

    if (!process.env.MONGO_URI) {
      const db = getData();
      const newTeam = {
        id: "team_" + Date.now(),
        teamName,
        workLocation,
        workDescription,
        supervisor,
        workers: workers.map(w => ({ ...w, _id: "worker_" + Math.random().toString(36).substr(2, 9) }))
      };

      db.teams.push(newTeam);
      saveData(db);

      return res.json({ message: "Team saved successfully to Mock DB", team: newTeam });
    }

    const newTeam = new Team({ teamName, workLocation, workDescription, supervisor, workers });
    await newTeam.save();

    res.json({ message: "Team saved successfully to MongoDB" });

  } catch (error) {
    res.status(500).json({ error: "Error saving team" });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    if (!process.env.MONGO_URI) {
      const db = getData();
      const teams = db.teams;
      const attendances = db.attendances || [];

      const todaysAttendances = attendances.filter(a => {
        const d = new Date(a.date);
        return d >= startOfDay && d <= endOfDay;
      });

      const formattedTeams = teams.map(team => {
        const teamObj = { ...team };
        teamObj.id = teamObj.id;
        teamObj.name = teamObj.teamName;
        teamObj.location = teamObj.workLocation;

        teamObj.workers = teamObj.workers.map(w => {
          const workerObj = { ...w };
          workerObj.id = w._id;
          workerObj.aadhaarId = w.aadhaarId || "MOCK-" + w._id.substring(0, 4);

          const atts = todaysAttendances.filter(a => a.workerId === w._id);
          workerObj.shifts = atts.map((a, idx) => a.shift || (idx + 1));
          workerObj.status = workerObj.shifts.length >= 3 ? 'present' : 'pending';
          if (atts.length > 0) {
            const latestAtt = [...atts].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            workerObj.lastAttendance = new Date(latestAtt.date).toLocaleTimeString('en-IN', { hour12: true });
          }
          return workerObj;
        });
        return teamObj;
      });

      return res.json(formattedTeams);
    }

    const teams = await Team.find().lean();
    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    const formattedTeams = teams.map(team => {
      const teamObj = { ...team };
      teamObj.id = teamObj._id;
      teamObj.name = teamObj.teamName;
      teamObj.location = teamObj.workLocation;

      teamObj.workers = teamObj.workers.map(worker => {
        const w = { ...worker };
        w.id = w._id;
        w.aadhaarId = w.aadhaarId || w._id.toString().substring(0, 8);

        const atts = attendances.filter(a => a.workerId.toString() === w._id.toString());
        w.shifts = atts.map((a, idx) => a.shift || (idx + 1));
        w.status = w.shifts.length >= 3 ? 'present' : 'pending';
        if (atts.length > 0) {
          const latestAtt = [...atts].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          w.lastAttendance = new Date(latestAtt.date).toLocaleTimeString('en-IN', { hour12: true });
        }
        return w;
      });
      return teamObj;
    });

    res.json(formattedTeams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching teams" });
  }
};

exports.getStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let totalWorkers = 0;
    let activeTeams = 0;
    let todayAttendance = 0;
    let pendingVerifications = 0;

    if (!process.env.MONGO_URI) {
      const db = getData();
      activeTeams = db.teams.length;

      db.teams.forEach(t => {
        totalWorkers += t.workers.length;
      });

      const todaysAttendances = (db.attendances || []).filter(a => {
        const d = new Date(a.date);
        return d >= startOfDay && d <= endOfDay;
      });
      todayAttendance = todaysAttendances.length;
      pendingVerifications = Math.max(0, totalWorkers - todayAttendance);

      return res.json({ totalWorkers, activeTeams, todayAttendance, pendingVerifications });
    }

    const teams = await Team.find();
    activeTeams = teams.length;

    teams.forEach(t => {
      totalWorkers += t.workers.length;
    });

    todayAttendance = await Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'present'
    });

    pendingVerifications = Math.max(0, totalWorkers - todayAttendance);

    res.json({ totalWorkers, activeTeams, todayAttendance, pendingVerifications });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching stats" });
  }
};

exports.getReports = async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      const db = getData();
      const teams = db.teams;
      const attendances = db.attendances || [];

      const grouped = {};
      attendances.forEach(att => {
        const day = new Date(att.date).toISOString().split('T')[0];
        const key = `${att.workerId}_${day}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: att.id || Math.random().toString(),
            workerId: att.workerId,
            date: att.date,
            shifts: new Set(),
            confidence: att.mlConfidence || 1.0,
            matchedPerson: att.mlMatchedPerson || 'N/A'
          };
        }
        if (att.shift !== undefined) grouped[key].shifts.add(att.shift);
        else grouped[key].shifts.add(`old_${Math.random()}`); // Count old records towards length
      });

      const reports = Object.values(grouped).map(group => {
        let workerObj = null;
        let teamObj = null;

        for (const team of teams) {
          const w = team.workers.find(wk => wk._id === group.workerId);
          if (w) {
            workerObj = w;
            teamObj = team;
            break;
          }
        }

        return {
          id: group.id,
          date: group.date,
          workerName: workerObj ? workerObj.name : 'Unknown Worker',
          aadhaarId: workerObj ? workerObj.aadhaarId : 'N/A',
          teamName: teamObj ? (teamObj.teamName || teamObj.name) : 'Unknown Team',
          status: group.shifts.size >= 3 ? 'present' : 'absent',
          confidence: group.confidence,
          matchedPerson: group.matchedPerson
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json(reports);
    }

    const attendances = await Attendance.find().sort({ date: -1 }).lean();
    const teams = await Team.find().lean();

    const grouped = {};
    attendances.forEach(att => {
      const day = new Date(att.date).toISOString().split('T')[0];
      const wId = att.workerId.toString();
      const key = `${wId}_${day}`;
      if (!grouped[key]) {
        grouped[key] = {
          id: att._id,
          workerId: wId,
          date: att.date,
          shifts: new Set(),
          confidence: att.mlConfidence || 1.0,
          matchedPerson: att.mlMatchedPerson || 'N/A'
        };
      }
      if (att.shift !== undefined) grouped[key].shifts.add(att.shift);
      else grouped[key].shifts.add(`old_${Math.random()}`);
    });

    const reports = Object.values(grouped).map(group => {
      let workerObj = null;
      let teamObj = null;

      for (const team of teams) {
        const w = team.workers.find(wk => wk._id.toString() === group.workerId);
        if (w) {
          workerObj = w;
          teamObj = team;
          break;
        }
      }

      return {
        id: group.id,
        date: group.date,
        workerName: workerObj ? workerObj.name : 'Unknown Worker',
        aadhaarId: workerObj ? workerObj.aadhaarId : 'N/A',
        teamName: teamObj ? (teamObj.teamName || teamObj.name) : 'Unknown Team',
        status: group.shifts.size >= 3 ? 'present' : 'absent',
        confidence: group.confidence,
        matchedPerson: group.matchedPerson
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching reports" });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      const db = getData();
      const teams = db.teams || [];
      const attendances = db.attendances || [];

      const activity = [];

      attendances.forEach(att => {
        let workerName = "Worker";
        let teamName = "Team";
        const team = teams.find(t => t.id === att.teamId);
        if (team) {
          teamName = team.teamName || team.name;
          const worker = team.workers.find(w => w._id === att.workerId);
          if (worker) workerName = worker.name;
        }

        activity.push({
          id: att.id,
          action: `${workerName} marked present in ${teamName}`,
          time: att.date,
          type: 'success',
          timestamp: new Date(att.date).getTime()
        });
      });

      teams.forEach(t => {
        let ts = Date.now();
        if (t.id && t.id.includes('_')) {
          const parsedTs = parseInt(t.id.split('_')[1]);
          if (!isNaN(parsedTs)) ts = parsedTs;
        } else if (t.id && /^[0-9a-fA-F]{24}$/.test(t.id)) {
          ts = parseInt(t.id.substring(0, 8), 16) * 1000;
        }

        activity.push({
          id: t.id,
          action: `New project team registered: ${t.teamName || t.name}`,
          time: new Date(ts).toISOString(),
          type: 'info',
          timestamp: ts
        });
      });

      const recent = activity
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 8);

      return res.json(recent);
    }

    const recentAttendances = await Attendance.find().sort({ date: -1 }).limit(10).lean();
    const teams = await Team.find().sort({ createdAt: -1 }).limit(10).lean();

    const activity = [];

    for (const att of recentAttendances) {
      let workerName = "Worker";
      const team = teams.find(t => t._id.toString() === att.teamId.toString());
      if (team) {
        const worker = team.workers.find(w => w._id.toString() === att.workerId.toString());
        if (worker) workerName = worker.name;
      }

      activity.push({
        id: att._id,
        action: `${workerName} marked present`,
        time: att.date,
        type: 'success',
        timestamp: new Date(att.date).getTime()
      });
    }

    teams.forEach(t => {
      activity.push({
        id: t._id,
        action: `New project team registered: ${t.teamName}`,
        time: t.createdAt || new Date(),
        type: 'info',
        timestamp: new Date(t.createdAt || Date.now()).getTime()
      });
    });

    const recent = activity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);

    res.json(recent);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching activity" });
  }
};

exports.getLabels = async (req, res) => {
  try {
    const labels = await getTrainedLabels();
    res.json({ labels });
  } catch (error) {
    res.status(500).json({ error: "Error fetching labels" });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!process.env.MONGO_URI) {
      const db = getData();
      db.teams = db.teams.filter(t => t.id !== id);
      db.attendances = (db.attendances || []).filter(a => a.teamId !== id);
      saveData(db);
      return res.json({ message: "Team deleted from Mock DB" });
    }
    await Team.findByIdAndDelete(id);
    await Attendance.deleteMany({ teamId: id });
    res.json({ message: "Team deleted from MongoDB" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting team" });
  }
};

exports.addWorker = async (req, res) => {
  try {
    const { teamId } = req.params;
    const workerData = req.body;
    if (!process.env.MONGO_URI) {
      const db = getData();
      const team = db.teams.find(t => t.id === teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      const newWorker = { ...workerData, _id: "worker_" + Math.random().toString(36).substr(2, 9) };
      team.workers.push(newWorker);
      saveData(db);
      return res.json({ message: "Worker added to Mock DB", worker: newWorker });
    }
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    team.workers.push(workerData);
    await team.save();
    res.json({ message: "Worker added to MongoDB", worker: team.workers[team.workers.length - 1] });
  } catch (error) {
    res.status(500).json({ error: "Error adding worker" });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { teamId, workerId } = req.params;
    const workerData = req.body;
    if (!process.env.MONGO_URI) {
      const db = getData();
      const team = db.teams.find(t => t.id === teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      const workerIdx = team.workers.findIndex(w => w._id === workerId);
      if (workerIdx === -1) return res.status(404).json({ error: "Worker not found" });
      team.workers[workerIdx] = { ...team.workers[workerIdx], ...workerData };
      saveData(db);
      return res.json({ message: "Worker updated in Mock DB" });
    }
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    const worker = team.workers.id(workerId);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    Object.assign(worker, workerData);
    await team.save();
    res.json({ message: "Worker updated in MongoDB" });
  } catch (error) {
    res.status(500).json({ error: "Error updating worker" });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const { teamId, workerId } = req.params;
    if (!process.env.MONGO_URI) {
      const db = getData();
      const team = db.teams.find(t => t.id === teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });
      team.workers = team.workers.filter(w => w._id !== workerId);
      db.attendances = (db.attendances || []).filter(a => a.workerId !== workerId);
      saveData(db);
      return res.json({ message: "Worker deleted from Mock DB" });
    }
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    team.workers.pull(workerId);
    await team.save();
    await Attendance.deleteMany({ workerId });
    res.json({ message: "Worker deleted from MongoDB" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting worker" });
  }
};