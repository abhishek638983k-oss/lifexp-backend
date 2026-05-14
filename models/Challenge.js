const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    xp: Number,
    difficulty: String,
    estimatedMinutes: Number,
    source: {
        type: String,
        enum: ["static", "rapid", "custom"],
        default: "static"
    },
    tags: [String],
    seedKey: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Challenge", challengeSchema);
