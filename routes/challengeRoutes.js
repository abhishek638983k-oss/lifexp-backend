const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getChallenge,
    getRapidChallenge,
    listChallenges,
    getCategories,
    seedChallenges,
    completeChallenge,
    addChallenge
} = require("../controllers/challengeController");

router.get("/categories", authMiddleware, getCategories);
router.get("/list", authMiddleware, listChallenges);
router.post("/get", authMiddleware, getChallenge);
router.post("/rapid", authMiddleware, getRapidChallenge);
router.post("/seed", authMiddleware, seedChallenges);
router.post("/complete", authMiddleware, completeChallenge);
router.post("/add", authMiddleware, addChallenge);

module.exports = router;
