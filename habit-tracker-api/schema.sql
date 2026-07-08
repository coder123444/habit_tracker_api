-- Habit Tracker API — PostgreSQL Schema
-- Run with: psql -U <user> -d <database> -f schema.sql

DROP TABLE IF EXISTS completion_logs CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE habits (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    frequency   VARCHAR(20) NOT NULL DEFAULT 'daily', -- daily | weekly
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE completion_logs (
    id          SERIAL PRIMARY KEY,
    habit_id    INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (habit_id, completed_on) -- prevents double-logging same day
);

-- Indexes for common query patterns
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_logs_habit_id ON completion_logs(habit_id);
CREATE INDEX idx_logs_completed_on ON completion_logs(completed_on);
