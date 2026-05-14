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
        enum: ["active", "pending_review", "completed", "rejected", "expired"],
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
    reviewedAt: Date,
    proofNote: String,
    proofImageDataUrl: String,
    proofImageMime: String,
    proofImageSize: Number,
    proofStatus: {
        type: String,
        enum: ["not_submitted", "manual_review", "approved", "rejected"],
        default: "not_submitted"
    },
    proofScore: Number,
    proofFeedback: String
}, {
    timestamps: true
});

module.exports = mongoose.model("ChallengeAttempt", challengeAttemptSchema);
