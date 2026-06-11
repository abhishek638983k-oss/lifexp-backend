const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { signup, login, changePassword, googleLogin } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/change-password", authMiddleware, changePassword);
router.post("/google", googleLogin);
module.exports = router;
