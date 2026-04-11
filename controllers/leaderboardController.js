const User = require("../models/User");

const getLeaderboard = async (req, res) => {
    try {
        const users = await User.find().sort({ xp: -1 }).limit(10);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getLeaderboard };
