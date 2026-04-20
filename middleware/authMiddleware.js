const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: "No token" });
        }

        const decoded = jwt.verify(token, "secretkey");

        req.user = decoded; // contains user id

        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;
