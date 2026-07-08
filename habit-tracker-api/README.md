# Habit Tracker API

A full-stack REST API for tracking daily/weekly habits, with JWT authentication,
PostgreSQL storage, and streak/completion-rate analytics.

## Stack
- Node.js + Express
- PostgreSQL (`pg`)
- JWT auth (`jsonwebtoken`) + password hashing (`bcryptjs`)
- Request validation (`zod`)
- Rate limiting (`express-rate-limit`)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a PostgreSQL database and load the schema:
   ```bash
   createdb habit_tracker
   psql -U <user> -d habit_tracker -f schema.sql
   ```

3. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

4. Run the server:
   ```bash
   npm run dev   # with nodemon (auto-restart)
   # or
   npm start
   ```

Server runs on `http://localhost:4000` by default.

## API Reference

### Auth
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | `{ email, password }` | Create account, returns JWT |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns JWT |

All routes below require `Authorization: Bearer <token>`.

### Habits
| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/habits` | `{ title, description?, frequency? }` | Create a habit |
| GET | `/api/habits` | — | List your habits |
| PATCH | `/api/habits/:id` | any of the fields above + `archived` | Update a habit |
| DELETE | `/api/habits/:id` | — | Delete a habit |
| POST | `/api/habits/:id/complete` | `{ completed_on? }` (defaults to today) | Log a completion |
| GET | `/api/habits/:id/stats` | — | Get streak + completion rate |

## Database Schema

Three related tables:
- `users` : accounts
- `habits` : belongs to a user
- `completion_logs` : belongs to a habit, one row per completed day
  (unique constraint on `(habit_id, completed_on)` prevents double-logging)

See `schema.sql` for full definitions and indexes.

## Notable design choices
- **Streak calculation** is done in application code (not a single SQL query)
  for readability  it walks completion dates backward from today/yesterday
  and counts consecutive days.
- **Ownership checks** (`assertOwnership`) run before every update/delete/log
  so one user can never modify another user's habits, even by guessing IDs.
- **Rate limiting** caps each IP at 100 requests / 15 minutes to prevent abuse.
