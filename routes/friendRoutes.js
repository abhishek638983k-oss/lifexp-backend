const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { sendRequest, acceptRequest } = require("../controllers/friendController");

router.post("/send", authMiddleware, sendRequest);
router.post("/accept", authMiddleware, acceptRequest);

module.exports = router;
