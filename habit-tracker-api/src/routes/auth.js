const express = require("express");
const { signup, login } = require("../controllers/authController");
const { validateBody, signupSchema, loginSchema } = require("../middleware/validate");

const router = express.Router();

router.post("/signup", validateBody(signupSchema), signup);
router.post("/login", validateBody(loginSchema), login);

module.exports = router;
