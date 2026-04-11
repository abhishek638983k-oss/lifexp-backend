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

        if (!user || !challenge) {
            return res.status(400).json({ message: "Invalid data" });
        }

        // ✅ XP increase
        user.xp += challenge.xp;

        // ✅ Category XP
        user.categoryXP[challenge.category] += challenge.xp;

        // ✅ Level logic
        user.level = Math.floor(Math.sqrt(user.xp / 50));

        // ✅ Streak logic
        const today = new Date().toDateString();

        if (user.lastCompleted) {
            const last = new Date(user.lastCompleted).toDateString();

            if (last === today) {
                // same day → no change
            } else {
                const diff =
                    (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24);

                if (diff === 1) {
                    user.streak += 1;
                } else {
                    user.streak = 1;
                }
            }
        } else {
            user.streak = 1;
        }

        user.lastCompleted = new Date();

        await user.save();

        res.json({ message: "Completed", user });

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

