const { predictIris } = require("../services/mlService");
const { getData, saveData } = require("../mockDb");
const User = require("../models/userModel");
const Team = require("../models/teamModel");
const Attendance = require("../models/attendanceModel");
const bcrypt = require("bcryptjs");


const createUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // MOCK DB MODE
    if (!process.env.MONGO_URI) {
        const db = getData();
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { 
            id: "user_" + Date.now(), 
            username, 
            password: hashedPassword,
            name: "MNREGA Admin",
            role: "Supervisor"
        };
        db.users = db.users || [];
        db.users.push(newUser);
        saveData(db);
        return res.json({ message: "User saved successfully to Mock DB" });
    }


    // MONGOOSE MODE
    const newUser = new User({ username, password });
    await newUser.save();
    return res.json({ message: "User saved successfully to MongoDB" });

  } catch (error) {
    res.status(500).json({ error: "Error saving user" });
  }
};

const markAttendance = async (req, res) => {
    try {
        const { teamId, workerId } = req.body;
        const db = getData();
        
        if (!teamId || !workerId) {
            return res.status(400).json({ error: "teamId and workerId are required" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        const imagePath = req.file.path;

        const result = await predictIris(imagePath);
        const { person, confidence } = result;

        if (person === "Unknown") {
            return res.status(400).json({
                message: "User not recognized",
                confidence
            });
        }

        // ======================= MOCK DB LOGIC =======================
        if (!process.env.MONGO_URI) {
            const db = getData();
            const team = db.teams.find(t => t.id === teamId);
            if (!team) return res.status(404).json({ error: "Team not found" });

            const worker = team.workers.find(w => w._id === workerId);
            if (!worker) return res.status(404).json({ error: "Worker not found in team" });

            if (worker.irisClassLabel !== person) {
                return res.status(400).json({
                    message: "Iris does not match the selected worker",
                    expected: worker.irisClassLabel,
                    detected: person,
                    confidence
                });
            }

            const newAttendance = {
                id: "att_" + Date.now(),
                teamId,
                workerId,
                date: new Date().toISOString(),
                confidence,
                status: "present"
            };

            db.attendances = db.attendances || [];
            db.attendances.push(newAttendance);
            saveData(db);

            return res.json({
                message: "Attendance marked successfully in Mock DB",
                person,
                confidence,
                attendance: newAttendance
            });
        }
        
        // ======================= MONGOOSE LOGIC =======================
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ error: "Team not found" });

        const worker = team.workers.id(workerId);
        if (!worker) return res.status(404).json({ error: "Worker not found in team" });

        if (worker.irisClassLabel !== person) {
            return res.status(400).json({
                message: "Iris does not match the selected worker",
                expected: worker.irisClassLabel,
                detected: person,
                confidence
            });
        }

        const newAttendance = new Attendance({
            teamId,
            workerId,
            confidence,
            status: "present"
        });

        await newAttendance.save();

        return res.json({
            message: "Attendance marked successfully in MongoDB",
            person,
            confidence,
            attendance: newAttendance
        });

    } catch (error) {
        console.error("Attendance Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // In a real app we'd use req.user.id from auth middleware
        // For this portal, we'll assume we're updating the 'admin' or logged-in user
        
        if (!process.env.MONGO_URI) {
            const db = getData();
            const admin = db.users.find(u => u.username === 'admin');
            
            if (!admin) return res.status(404).json({ error: "Admin user not found" });
            
            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Current password incorrect" });
            }

            admin.password = await bcrypt.hash(newPassword, 10);
            saveData(db);
            return res.json({ message: "Password updated successfully in Mock DB" });
        }

        const admin = await User.findOne({ username: 'admin' });
        if (!admin) return res.status(404).json({ error: "Admin user not found" });
        
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password incorrect" });
        }

        admin.password = newPassword; // Mongoose middleware will hash this
        await admin.save();
        res.json({ message: "Password updated successfully in MongoDB" });


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating password" });
    }
};

module.exports = {
    createUser,
    markAttendance,
    changePassword
};