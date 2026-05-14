const Challenge = require("../models/Challenge");
const ChallengeAttempt = require("../models/ChallengeAttempt");
const User = require("../models/User");

const addCategoryXP = (user, category, xp) => {
    if (!user.categoryXP) user.categoryXP = {};
    user.categoryXP[category] = (user.categoryXP[category] || 0) + xp;
    user.markModified("categoryXP");
};

const publicUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.__v;
    return obj;
};

const awardChallengeXP = (user, challenge) => {
    user.xp += challenge.xp;
    addCategoryXP(user, challenge.category, challenge.xp);
    user.level = Math.max(1, Math.floor(Math.sqrt(user.xp / 50)) + 1);

    const today = new Date().toDateString();

    if (user.lastCompleted) {
        const last = new Date(user.lastCompleted).toDateString();

        if (last !== today) {
            const diff =
                (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24);

            user.streak = diff === 1 ? user.streak + 1 : 1;
        }
    } else {
        user.streak = 1;
    }

    user.lastCompleted = new Date();
};

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

const listChallenges = async (req, res) => {
    try {
        const challenges = await Challenge.find()
            .sort({ createdAt: -1, category: 1, title: 1 })
            .limit(200);

        res.json(challenges);
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

const approveAttempt = async (req, res) => {
    try {
        const attempt = await ChallengeAttempt.findById(req.params.id);

        if (!attempt) return res.status(404).json({ message: "Attempt not found" });
        if (attempt.status === "completed") {
            return res.status(400).json({ message: "Attempt already completed" });
        }

        const [user, challenge] = await Promise.all([
            User.findById(attempt.user),
            Challenge.findById(attempt.challenge)
        ]);

        if (!user || !challenge) {
            return res.status(400).json({ message: "Invalid attempt data" });
        }

        awardChallengeXP(user, challenge);
        attempt.status = "completed";
        attempt.proofStatus = "approved";
        attempt.proofFeedback = req.body.feedback || "Approved by admin.";
        attempt.completedAt = new Date();
        attempt.reviewedAt = new Date();

        await user.save();
        await attempt.save();

        res.json({ message: "Attempt approved", attempt, user: publicUser(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const rejectAttempt = async (req, res) => {
    try {
        const attempt = await ChallengeAttempt.findById(req.params.id);

        if (!attempt) return res.status(404).json({ message: "Attempt not found" });
        if (attempt.status === "completed") {
            return res.status(400).json({ message: "Completed attempts cannot be rejected" });
        }

        attempt.status = "rejected";
        attempt.proofStatus = "rejected";
        attempt.proofFeedback = req.body.feedback || "Rejected by admin.";
        attempt.reviewedAt = new Date();

        await attempt.save();

        res.json({ message: "Attempt rejected", attempt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getStats,
    listUsers,
    updateUser,
    deleteUser,
    listChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    listAttempts,
    approveAttempt,
    rejectAttempt
};
