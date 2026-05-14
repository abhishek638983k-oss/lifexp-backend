const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
    try {
        const adminSecret = process.env.ADMIN_SECRET;
        const providedSecret = req.headers["x-admin-secret"];

        if (!adminSecret) {
            return res.status(500).json({ message: "ADMIN_SECRET is not configured" });
        }

        if (providedSecret && providedSecret === adminSecret) {
            return next();
        }

        if (!req.user?.id) {
            return res.status(403).json({ message: "Admin access required" });
        }

        const user = await User.findById(req.user.id);

        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = adminMiddleware;
