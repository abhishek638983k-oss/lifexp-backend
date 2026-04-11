const express = require("express");
const router = express.Router();

const {
    getChallenge,
    completeChallenge,
    addChallenge
} = require("../controllers/challengeController");

router.post("/get", getChallenge);
router.post("/complete", completeChallenge);
router.post("/add", addChallenge);

module.exports = router;
