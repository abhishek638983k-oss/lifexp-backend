const express = require("express");
const router = express.Router();

const { sendRequest, acceptRequest } = require("../controllers/friendController");

router.post("/send", sendRequest);
router.post("/accept", acceptRequest);

module.exports = router;
