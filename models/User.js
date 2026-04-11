const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,

    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    streak: { type: Number, default: 0 },
    lastCompleted: Date,

   friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
   friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    categoryXP: {
        coding: { type: Number, default: 0 },
        fitness: { type: Number, default: 0 },
        study: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model("User", userSchema);
