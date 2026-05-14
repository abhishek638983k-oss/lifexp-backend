const jwt = require("jsonwebtoken");

const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        req.user = jwt.verify(token, "secretkey");
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};

module.exports = optionalAuthMiddleware;
