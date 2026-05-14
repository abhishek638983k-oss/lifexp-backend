const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
    getStats,
    listUsers,
    updateUser,
    deleteUser,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    listAttempts
} = require("../controllers/adminController");

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/challenges", createChallenge);
router.patch("/challenges/:id", updateChallenge);
router.delete("/challenges/:id", deleteChallenge);
router.get("/attempts", listAttempts);

module.exports = router;
