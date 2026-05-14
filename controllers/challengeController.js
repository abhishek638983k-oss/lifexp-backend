const Challenge = require("../models/Challenge");
const ChallengeAttempt = require("../models/ChallengeAttempt");
const User = require("../models/User");
const {
    CATEGORIES,
    buildSeedChallenges,
    buildRapidChallenge
} = require("../data/challengeBank");

const validCategories = CATEGORIES.map(category => category.key);
const validDifficulties = ["easy", "medium", "hard"];

const ensureSeedChallenges = async () => {
    const count = await Challenge.countDocuments({ source: "static" });

    if (count > 0) {
        return { inserted: 0, total: count };
    }

    const seedChallenges = buildSeedChallenges();

    try {
        await Challenge.insertMany(seedChallenges, { ordered: false });
    } catch (err) {
        if (err.code !== 11000) throw err;
    }

    const total = await Challenge.countDocuments({ source: "static" });
    return { inserted: seedChallenges.length, total };
};

const normalizeFilters = ({ category, categories, difficulty }) => {
    const filters = {};
    const selectedCategories = Array.isArray(categories)
        ? categories
        : Array.isArray(category)
            ? category
            : category
                ? [category]
                : [];
    const cleanCategories = selectedCategories.filter(item => validCategories.includes(item));

    if (cleanCategories.length === 1) {
        filters.category = cleanCategories[0];
    } else if (cleanCategories.length > 1) {
        filters.category = { $in: cleanCategories };
    }

    if (difficulty && validDifficulties.includes(difficulty)) {
        filters.difficulty = difficulty;
    }

    return filters;
};

const minimumSecondsFor = (challenge) => {
    const rapid = challenge.source === "rapid";
    const seconds = rapid
        ? { easy: 15, medium: 45, hard: 90 }
        : { easy: 20, medium: 60, hard: 120 };

    return seconds[challenge.difficulty] || 20;
};

const createAttempt = async (userId, challenge) => {
    const minimumSeconds = minimumSecondsFor(challenge);
    const earliestCompleteAt = new Date(Date.now() + minimumSeconds * 1000);

    return ChallengeAttempt.create({
        user: userId,
        challenge: challenge._id,
        category: challenge.category,
        difficulty: challenge.difficulty,
        source: challenge.source,
        xp: challenge.xp,
        earliestCompleteAt
    });
};

const challengeWithAttempt = async (userId, challenge) => {
    const attempt = await createAttempt(userId, challenge);

    return {
        challenge,
        attempt: {
            _id: attempt._id,
            status: attempt.status,
            startedAt: attempt.startedAt,
            earliestCompleteAt: attempt.earliestCompleteAt
        }
    };
};

const addCategoryXP = (user, category, xp) => {
    if (!user.categoryXP) user.categoryXP = {};
    user.categoryXP[category] = (user.categoryXP[category] || 0) + xp;
    user.markModified("categoryXP");
};

// GET RANDOM CHALLENGE
const getChallenge = async (req, res) => {
    try {
        await ensureSeedChallenges();

        const filters = normalizeFilters(req.body);

        const challenges = await Challenge.find({
            ...filters,
            source: { $in: ["static", "custom"] }
        });

        if (!challenges.length) {
            return res.status(404).json({ message: "No challenge found" });
        }

        const random = challenges[Math.floor(Math.random() * challenges.length)];

        res.json(await challengeWithAttempt(req.user.id, random));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET RAPID DYNAMIC CHALLENGE
const getRapidChallenge = async (req, res) => {
    try {
        const selectedCategories = Array.isArray(req.body.categories)
            ? req.body.categories.filter(item => validCategories.includes(item))
            : validCategories.includes(req.body.category)
                ? [req.body.category]
                : ["coding"];
        const category = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
        const difficulty = validDifficulties.includes(req.body.difficulty)
            ? req.body.difficulty
            : "easy";

        const challenge = new Challenge(buildRapidChallenge(category, difficulty));
        await challenge.save();

        res.json(await challengeWithAttempt(req.user.id, challenge));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// LIST CHALLENGES
const listChallenges = async (req, res) => {
    try {
        await ensureSeedChallenges();

        const filters = normalizeFilters(req.query);
        const challenges = await Challenge.find(filters)
            .sort({ category: 1, difficulty: 1, title: 1 })
            .limit(200);

        res.json(challenges);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// LIST CATEGORIES
const getCategories = async (req, res) => {
    res.json(CATEGORIES);
};

// SEED STATIC CHALLENGES
const seedChallenges = async (req, res) => {
    try {
        const result = await ensureSeedChallenges();
        res.json({
            message: "Static challenges ready",
            ...result
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// COMPLETE CHALLENGE
const completeChallenge = async (req, res) => {
    try {
        const { attemptId, proofNote } = req.body;

        const attempt = await ChallengeAttempt.findById(attemptId);

        if (!attempt) {
            return res.status(400).json({ message: "Invalid data" });
        }

        if (attempt.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "This attempt belongs to another user" });
        }

        if (attempt.status !== "active") {
            return res.status(400).json({ message: "Challenge already completed" });
        }

        if (new Date() < attempt.earliestCompleteAt) {
            const waitSeconds = Math.ceil((attempt.earliestCompleteAt - new Date()) / 1000);
            return res.status(400).json({
                message: `Too fast. Wait ${waitSeconds}s before completing this challenge.`,
                waitSeconds
            });
        }

        const user = await User.findById(req.user.id);
        const challenge = await Challenge.findById(attempt.challenge);

        if (!user || !challenge) {
            return res.status(400).json({ message: "Invalid data" });
        }

        // ✅ XP increase
        user.xp += challenge.xp;

        // ✅ Category XP
        addCategoryXP(user, challenge.category, challenge.xp);

        // ✅ Level logic
        user.level = Math.max(1, Math.floor(Math.sqrt(user.xp / 50)) + 1);

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
        attempt.status = "completed";
        attempt.completedAt = new Date();
        attempt.proofNote = proofNote || "";

        await user.save();
        await attempt.save();

        res.json({ message: "Completed", user, attempt });

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

module.exports = {
    getChallenge,
    getRapidChallenge,
    listChallenges,
    getCategories,
    seedChallenges,
    completeChallenge,
    addChallenge
};

