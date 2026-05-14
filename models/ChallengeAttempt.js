const mongoose = require("mongoose");

const challengeAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Challenge",
        required: true
    },
    status: {
        type: String,
        enum: ["active", "completed", "expired"],
        default: "active"
    },
    category: String,
    difficulty: String,
    source: String,
    xp: Number,
    startedAt: {
        type: Date,
        default: Date.now
    },
    earliestCompleteAt: Date,
    completedAt: Date,
    proofNote: String
}, {
    timestamps: true
});

module.exports = mongoose.model("ChallengeAttempt", challengeAttemptSchema);
