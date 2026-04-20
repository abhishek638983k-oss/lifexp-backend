const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getChallenge,
    completeChallenge,
    addChallenge
} = require("../controllers/challengeController");

router.post("/get", authMiddleware, getChallenge);
router.post("/complete", authMiddleware, completeChallenge);
router.post("/add", authMiddleware, addChallenge);

module.exports = router;
