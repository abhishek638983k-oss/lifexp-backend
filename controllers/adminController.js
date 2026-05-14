const Challenge = require("../models/Challenge");
const ChallengeAttempt = require("../models/ChallengeAttempt");
const User = require("../models/User");

const getStats = async (req, res) => {
    try {
        const [
            users,
            challenges,
            activeAttempts,
            completedAttempts,
            totalXP
        ] = await Promise.all([
            User.countDocuments(),
            Challenge.countDocuments(),
            ChallengeAttempt.countDocuments({ status: "active" }),
            ChallengeAttempt.countDocuments({ status: "completed" }),
            User.aggregate([{ $group: { _id: null, xp: { $sum: "$xp" } } }])
        ]);

        res.json({
            users,
            challenges,
            activeAttempts,
            completedAttempts,
            totalXP: totalXP[0]?.xp || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const listUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1, xp: -1 })
            .limit(200);

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const allowed = ["username", "xp", "level", "streak", "role"];
        const updates = {};

        allowed.forEach(key => {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        });

        if (updates.xp !== undefined && updates.level === undefined) {
            updates.level = Math.max(1, Math.floor(Math.sqrt(Number(updates.xp) / 50)) + 1);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User updated", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        await ChallengeAttempt.deleteMany({ user: req.params.id });
        await User.updateMany(
            {},
            {
                $pull: {
                    friends: req.params.id,
                    friendRequests: req.params.id
                }
            }
        );

        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createChallenge = async (req, res) => {
    try {
        const challenge = new Challenge({
            ...req.body,
            source: req.body.source || "custom"
        });
        await challenge.save();

        res.json({ message: "Challenge added", challenge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!challenge) return res.status(404).json({ message: "Challenge not found" });

        res.json({ message: "Challenge updated", challenge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndDelete(req.params.id);

        if (!challenge) return res.status(404).json({ message: "Challenge not found" });

        res.json({ message: "Challenge deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const listAttempts = async (req, res) => {
    try {
        const attempts = await ChallengeAttempt.find()
            .populate("user", "username xp level")
            .populate("challenge", "title category difficulty xp source")
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(attempts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getStats,
    listUsers,
    updateUser,
    deleteUser,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    listAttempts
};
