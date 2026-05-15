const express = require("express");
const router = express.Router();
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
    getStats,
    listUsers,
    updateUser,
    deleteUser,
    listChallenges,
    createChallenge,
    generateChallenges,
    updateChallenge,
    deleteChallenge,
    listAttempts,
    approveAttempt,
    rejectAttempt
} = require("../controllers/adminController");

router.use(optionalAuthMiddleware, adminMiddleware);

router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/challenges", listChallenges);
router.post("/challenges", createChallenge);
router.post("/challenges/generate", generateChallenges);
router.patch("/challenges/:id", updateChallenge);
router.delete("/challenges/:id", deleteChallenge);
router.get("/attempts", listAttempts);
router.post("/attempts/:id/approve", approveAttempt);
router.post("/attempts/:id/reject", rejectAttempt);

module.exports = router;
