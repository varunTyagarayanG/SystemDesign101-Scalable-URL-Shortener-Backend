/**
 * services/key-generator-service/src/db.js
 *
 * Creates a single Pool instance to Postgres (reads PG_URI from .env).
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.PG_URI
});

module.exports = pool;
