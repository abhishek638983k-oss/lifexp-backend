const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// SIGNUP
const signup = async (req, res) => {
    try {
        const { username, password } = req.body;

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ message: "User exists" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashed
        });

        await user.save();

        res.json({ message: "Signup success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// LOGIN
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid" });
        }

       const token = jwt.sign(
            { id: user._id },
            "secretkey",
            { expiresIn: "7d" }
            );
            
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { signup, login };
