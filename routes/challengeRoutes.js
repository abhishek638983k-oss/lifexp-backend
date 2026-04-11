const express = require("express");
const router = express.Router();

const {
    getChallenge,
    completeChallenge
} = require("../controllers/challengeController");

router.post("/get", getChallenge);
router.post("/complete", completeChallenge);

module.exports = router;
