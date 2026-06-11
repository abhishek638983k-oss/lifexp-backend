const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createToken = (user) => jwt.sign(
    { id: user._id },
    "secretkey",
    { expiresIn: "7d" }
);

const publicUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.__v;
    return obj;
};

const uniqueUsername = async (base) => {
    const cleaned = (base || "googleuser")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 18) || "googleuser";
    let candidate = cleaned;
    let suffix = 1;

    while (await User.findOne({ username: candidate })) {
        candidate = `${cleaned}${suffix}`;
        suffix += 1;
    }

    return candidate;
};
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

       const token = createToken(user);
            
        res.json({ token, user: publicUser(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters." });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.password) {
            user.password = await bcrypt.hash(newPassword, 10);
            user.authProvider = user.authProvider || "local";
            await user.save();
            return res.json({ message: "Password set successfully", user: publicUser(user) });
        }

        const isMatch = await bcrypt.compare(currentPassword || "", user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password changed successfully", user: publicUser(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        const clientId = process.env.GOOGLE_CLIENT_ID;

        if (!clientId) {
            return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured" });
        }

        if (!credential) {
            return res.status(400).json({ message: "Google credential missing" });
        }

        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );

        if (!response.ok) {
            return res.status(401).json({ message: "Invalid Google token" });
        }

        const profile = await response.json();

        if (
            profile.aud !== clientId
            || (profile.email_verified !== "true" && profile.email_verified !== true)
            || !profile.email
        ) {
            return res.status(401).json({ message: "Google token verification failed" });
        }

        let user = await User.findOne({
            $or: [
                { googleId: profile.sub },
                { email: profile.email }
            ]
        });

        if (!user) {
            user = new User({
                username: await uniqueUsername(profile.email.split("@")[0]),
                email: profile.email,
                googleId: profile.sub,
                authProvider: "google",
                password: undefined
            });
        } else {
            user.googleId = user.googleId || profile.sub;
            user.email = user.email || profile.email;
            user.authProvider = user.authProvider || "google";
        }

        await user.save();

        res.json({
            token: createToken(user),
            user: publicUser(user)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { signup, login, changePassword, googleLogin };
