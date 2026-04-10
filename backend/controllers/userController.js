const { predictIris } = require("../services/mlService");
const { getData, saveData } = require("../mockDb");
const User = require("../models/userModel");
const Team = require("../models/teamModel");
const Attendance = require("../models/attendanceModel");
const bcrypt = require("bcryptjs");

// ======================= LOGIN (Authenticate user) =======================
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // MOCK DB MODE
        if (!process.env.MONGO_URI) {
            const db = getData();
            const user = (db.users || []).find(u => u.username === username);

            if (!user) {
                return res.status(401).json({ error: "Invalid username or password" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "Invalid username or password" });
            }

            return res.json({
                message: "Login successful",
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name || "MNREGA Admin",
                    role: user.role || "Supervisor"
                }
            });
        }

        // MONGOOSE MODE
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        return res.json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                name: user.name || "MNREGA Admin",
                role: user.role || "Supervisor"
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Error during login" });
    }
};

// ======================= MARK ATTENDANCE =======================
const markAttendance = async (req, res) => {
    try {
        const { teamId, workerId } = req.body;

        if (!teamId || !workerId) {
            return res.status(400).json({ error: "teamId and workerId are required" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        // Use buffer directly from memory storage (no disk required)
        const result = await predictIris(req.file.buffer);
        const { person, confidence } = result;

        if (person === "Unknown") {
            return res.status(400).json({
                message: "User not recognized by iris scan",
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
                message: "Attendance marked successfully",
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
            message: "Attendance marked successfully",
            person,
            confidence,
            attendance: newAttendance
        });

    } catch (error) {
        console.error("Attendance Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ======================= CHANGE PASSWORD =======================
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Both current and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }

        if (!process.env.MONGO_URI) {
            const db = getData();
            const admin = (db.users || []).find(u => u.username === 'admin');

            if (!admin) return res.status(404).json({ error: "Admin user not found" });

            const isMatch = await bcrypt.compare(currentPassword, admin.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Current password incorrect" });
            }

            admin.password = await bcrypt.hash(newPassword, 10);
            saveData(db);
            return res.json({ message: "Password updated successfully" });
        }

        const admin = await User.findOne({ username: 'admin' });
        if (!admin) return res.status(404).json({ error: "Admin user not found" });

        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password incorrect" });
        }

        admin.password = newPassword; // Mongoose pre-save will hash it
        await admin.save();
        res.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: "Error updating password" });
    }
};

module.exports = { loginUser, markAttendance, changePassword };