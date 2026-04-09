const { getData, saveData } = require("../mockDb");
const Team = require("../models/teamModel");
const Attendance = require("../models/attendanceModel");

exports.createTeam = async (req, res) => {
  try {
    const { teamName, workLocation, workDescription, supervisor, workers } = req.body;
    
    // ================= MOCK DB =================
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

    // ================= MONGOOSE =================
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
    
    // ================= MOCK DB =================
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
          teamObj.id = teamObj.id; // already has id
          teamObj.name = teamObj.teamName;
          teamObj.location = teamObj.workLocation;
          
          teamObj.workers = teamObj.workers.map(w => {
            const workerObj = { ...w };
            workerObj.id = w._id;
            workerObj.aadhaarId = w.aadhaarId || "MOCK-" + w._id.substring(0, 4);
            
            const att = todaysAttendances.find(a => a.workerId === w._id);
            workerObj.status = att ? att.status : 'pending';
            if (att) {
                workerObj.lastAttendance = new Date(att.date).toLocaleTimeString('en-IN', { hour12: true });
            }
            return workerObj;
          });
          return teamObj;
        });

        return res.json(formattedTeams);
    }
    
    // ================= MONGOOSE =================
    const teams = await Team.find();
    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const formattedTeams = teams.map(team => {
      const teamObj = team.toObject();
      teamObj.id = teamObj._id;
      teamObj.name = teamObj.teamName;
      teamObj.location = teamObj.workLocation;
      
      teamObj.workers = teamObj.workers.map(w => {
        w.id = w._id;
        w.aadhaarId = w.aadhaarId || w._id.toString().substring(0, 8); 
        
        const att = attendances.find(a => a.workerId.toString() === w._id.toString());
        w.status = att ? att.status : 'pending';
        if (att) {
            w.lastAttendance = new Date(att.date).toLocaleTimeString('en-IN', { hour12: true });
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

    // ================= MOCK DB =================
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

    // ================= MONGOOSE =================
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
    // ================= MOCK DB =================
    if (!process.env.MONGO_URI) {
        const db = getData();
        const teams = db.teams;
        const attendances = db.attendances || [];
        
        // Enrich attendance with worker and team data
        const reports = attendances.map(att => {
            let workerObj = null;
            let teamObj = null;

            for (const team of teams) {
                const w = team.workers.find(wk => wk._id === att.workerId);
                if (w) {
                    workerObj = w;
                    teamObj = team;
                    break;
                }
            }

            return {
                id: att.id || Math.random().toString(),
                date: att.date,
                workerName: workerObj ? workerObj.name : 'Unknown Worker',
                aadhaarId: workerObj ? workerObj.aadhaarId : 'N/A',
                teamName: teamObj ? (teamObj.teamName || teamObj.name) : 'Unknown Team',
                status: att.status,
                confidence: att.mlConfidence || 1.0,
                matchedPerson: att.mlMatchedPerson || 'N/A'
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.json(reports);
    }

    // ================= MONGOOSE =================
    const attendances = await Attendance.find().sort({ date: -1 }).lean();
    
    // We would ideally populate, but for simplicity we manually join or ensure fields
    // Assuming we have workerId, let's fetch teams.
    const teams = await Team.find().lean();

    const reports = attendances.map(att => {
        let workerObj = null;
        let teamObj = null;

        for (const team of teams) {
            const w = team.workers.find(wk => wk._id.toString() === att.workerId.toString());
            if (w) {
                workerObj = w;
                teamObj = team;
                break;
            }
        }

        return {
            id: att._id,
            date: att.date,
            workerName: workerObj ? workerObj.name : 'Unknown Worker',
            aadhaarId: workerObj ? workerObj.aadhaarId : 'N/A',
            teamName: teamObj ? (teamObj.teamName || teamObj.name) : 'Unknown Team',
            status: att.status,
            confidence: att.mlConfidence || 1.0,
            matchedPerson: att.mlMatchedPerson || 'N/A'
        };
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching reports" });
  }
};

exports.getRecentActivity = async (req, res) => {
    try {
        // ================= MOCK DB =================
        if (!process.env.MONGO_URI) {
            const db = getData();
            const teams = db.teams || [];
            const attendances = db.attendances || [];

            const activity = [];

            // 1. Process Attendances
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

            // 2. Process Teams
            teams.forEach(t => {
                let ts = Date.now(); // default to now
                if (t.id && t.id.includes('_')) {
                    const parsedTs = parseInt(t.id.split('_')[1]);
                    if (!isNaN(parsedTs)) ts = parsedTs;
                } else if (t.id && /^[0-9a-fA-F]{24}$/.test(t.id)) {
                    // It's likely a MongoDB-style ObjectID hex string
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

            // Sort and limit
            const recent = activity
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 8); // Show top 8 for a cleaner dashboard

            return res.json(recent);
        }

        // ================= MONGOOSE =================
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