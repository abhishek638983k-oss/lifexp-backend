const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { sendRequest, acceptRequest, getFriends } = require("../controllers/friendController");

router.get("/:userId", authMiddleware, getFriends);
router.post("/send", authMiddleware, sendRequest);
router.post("/accept", authMiddleware, acceptRequest);

module.exports = router;
