// services/backend/src/db/postgres.js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.PG_URI });

async function connectPostgres(retries = 10, delayMs = 2000) {
    for (let i = 1; i <= retries; i++) {
        try {
            await pool.query('SELECT 1');
            console.log('PostgreSQL connected');
            return;
        } catch (err) {
            console.warn(
                `Postgres connection attempt ${i} failed (${err.message}). ` +
                `Retrying in ${delayMs}ms…`
            );
            await new Promise(r => setTimeout(r, delayMs));
        }
    }
    console.error(`Failed to connect to Postgres after ${retries} attempts.`);
    process.exit(1);
}

module.exports = { pool, connectPostgres };
