const User = require("../models/User");

// Signup
const signup = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = new User({ username, password });
        await user.save();

        res.json({ message: "User created", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { signup };
