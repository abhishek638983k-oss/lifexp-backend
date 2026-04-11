const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
    title: String,
    category: String,
    xp: Number,
    difficulty: String
});

module.exports = mongoose.model("Challenge", challengeSchema);
