const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { signup, login } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/all", async (req, res) => {
    const users = await require("../models/User").find();
    res.json(users);
});
module.exports = router;
