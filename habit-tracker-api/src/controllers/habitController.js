const pool = require("../config/db");

async function createHabit(req, res) {
  const { title, description, frequency } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO habits (user_id, title, description, frequency)
       VALUES ($1, $2, $3, COALESCE($4, 'daily'))
       RETURNING *`,
      [req.userId, title, description || null, frequency]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create habit error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function listHabits(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM habits WHERE user_id = $1 AND archived = FALSE ORDER BY created_at DESC`,
      [req.userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("List habits error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function updateHabit(req, res) {
  const { id } = req.params;
  const { title, description, frequency, archived } = req.body;

  try {
    const owned = await assertOwnership(id, req.userId);
    if (!owned) return res.status(404).json({ error: "Habit not found" });

    const result = await pool.query(
      `UPDATE habits
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           frequency = COALESCE($3, frequency),
           archived = COALESCE($4, archived)
       WHERE id = $5
       RETURNING *`,
      [title, description, frequency, archived, id]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Update habit error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteHabit(req, res) {
  const { id } = req.params;

  try {
    const owned = await assertOwnership(id, req.userId);
    if (!owned) return res.status(404).json({ error: "Habit not found" });

    await pool.query("DELETE FROM habits WHERE id = $1", [id]);
    return res.status(204).send();
  } catch (err) {
    console.error("Delete habit error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Marks a habit complete for a given date (defaults to today).
// Relies on the UNIQUE(habit_id, completed_on) constraint to avoid duplicates.
async function logCompletion(req, res) {
  const { id } = req.params;
  const { completed_on } = req.body; // optional, defaults to CURRENT_DATE in schema

  try {
    const owned = await assertOwnership(id, req.userId);
    if (!owned) return res.status(404).json({ error: "Habit not found" });

    const result = await pool.query(
      `INSERT INTO completion_logs (habit_id, completed_on)
       VALUES ($1, COALESCE($2, CURRENT_DATE))
       ON CONFLICT (habit_id, completed_on) DO NOTHING
       RETURNING *`,
      [id, completed_on || null]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Already logged for this date" });
    }

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Log completion error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Returns current streak (consecutive days up to today/yesterday) and
// overall completion rate since the habit was created.
async function getHabitStats(req, res) {
  const { id } = req.params;

  try {
    const owned = await assertOwnership(id, req.userId);
    if (!owned) return res.status(404).json({ error: "Habit not found" });

    const habitResult = await pool.query("SELECT created_at FROM habits WHERE id = $1", [id]);
    const createdAt = habitResult.rows[0].created_at;

    const logsResult = await pool.query(
      `SELECT completed_on FROM completion_logs
       WHERE habit_id = $1
       ORDER BY completed_on DESC`,
      [id]
    );

    const completedDates = logsResult.rows.map((r) => r.completed_on);
    const streak = computeStreak(completedDates);

    const daysSinceCreation = Math.max(
      1,
      Math.ceil((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    );
    const completionRate = completedDates.length / daysSinceCreation;

    return res.json({
      habitId: Number(id),
      totalCompletions: completedDates.length,
      currentStreak: streak,
      completionRate: Number(completionRate.toFixed(3)),
    });
  } catch (err) {
    console.error("Get habit stats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// --- helpers ---

async function assertOwnership(habitId, userId) {
  const result = await pool.query("SELECT id FROM habits WHERE id = $1 AND user_id = $2", [
    habitId,
    userId,
  ]);
  return result.rows.length > 0;
}

// dates: array of Date objects, sorted descending (most recent first)
function computeStreak(dates) {
  if (dates.length === 0) return 0;

  const oneDay = 24 * 60 * 60 * 1000;
  const today = startOfDay(new Date());

  let expected = today;
  let streak = 0;

  // Allow the streak to still count if today isn't logged yet but yesterday was
  const mostRecent = startOfDay(new Date(dates[0]));
  if (mostRecent.getTime() === today.getTime() - oneDay) {
    expected = mostRecent;
  } else if (mostRecent.getTime() !== today.getTime()) {
    return 0; // streak broken — most recent completion isn't today or yesterday
  }

  for (const d of dates) {
    const day = startOfDay(new Date(d));
    if (day.getTime() === expected.getTime()) {
      streak += 1;
      expected = new Date(expected.getTime() - oneDay);
    } else if (day.getTime() < expected.getTime()) {
      break;
    }
  }

  return streak;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

module.exports = {
  createHabit,
  listHabits,
  updateHabit,
  deleteHabit,
  logCompletion,
  getHabitStats,
};
