const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    password: String,
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    streak: { type: Number, default: 0 },
    lastCompleted: Date,

   friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    categoryXP: {
        coding: { type: Number, default: 0 },
        fitness: { type: Number, default: 0 },
        study: { type: Number, default: 0 },
        health: { type: Number, default: 0 },
        career: { type: Number, default: 0 },
        creativity: { type: Number, default: 0 },
        mindfulness: { type: Number, default: 0 },
        finance: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        household: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);
