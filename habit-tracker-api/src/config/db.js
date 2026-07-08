const { Pool } = require("pg");

// Pool reads PG* environment variables automatically (PGUSER, PGPASSWORD,
// PGHOST, PGPORT, PGDATABASE), but we pass them explicitly for clarity.
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(1);
});

module.exports = pool;
