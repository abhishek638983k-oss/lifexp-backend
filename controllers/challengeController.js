const Challenge = require("../models/Challenge");
const User = require("../models/User");

// GET RANDOM CHALLENGE
const getChallenge = async (req, res) => {
    try {
        const { category } = req.body;

        const challenges = await Challenge.find({ category });

        const random =
            challenges[Math.floor(Math.random() * challenges.length)];

        res.json(random);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// COMPLETE CHALLENGE
const completeChallenge = async (req, res) => {
    try {
        const { userId, challengeId } = req.body;

        const user = await User.findById(userId);
        const challenge = await Challenge.findById(challengeId);

        user.xp += challenge.xp;

        // LEVEL LOGIC
        user.level = Math.floor(Math.sqrt(user.xp / 50));

        await user.save();

        res.json({ message: "Challenge completed", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addChallenge = async (req, res) => {
    try {
        const challenge = new Challenge(req.body);
        await challenge.save();

        res.json({ message: "Challenge added", challenge });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = { getChallenge, completeChallenge, addChallenge};

