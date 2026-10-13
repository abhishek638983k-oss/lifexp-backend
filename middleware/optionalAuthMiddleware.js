const jwt = require("jsonwebtoken");
const getJwtSecret = require("../config/jwt");

const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        req.user = jwt.verify(token, getJwtSecret());
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

module.exports = optionalAuthMiddleware;
