const express = require("express");
const {
  createHabit,
  listHabits,
  updateHabit,
  deleteHabit,
  logCompletion,
  getHabitStats,
} = require("../controllers/habitController");
const { requireAuth } = require("../middleware/auth");
const { validateBody, habitSchema } = require("../middleware/validate");

const router = express.Router();

// All habit routes require a valid JWT
router.use(requireAuth);

router.post("/", validateBody(habitSchema), createHabit);
router.get("/", listHabits);
router.patch("/:id", updateHabit);
router.delete("/:id", deleteHabit);

router.post("/:id/complete", logCompletion);
router.get("/:id/stats", getHabitStats);

module.exports = router;
