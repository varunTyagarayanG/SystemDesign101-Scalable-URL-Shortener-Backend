/**
 * scripts/preload-keys.js
 *
 * Run this script to generate a large number of unique
 * base62 short_id values and batch-insert them into Postgres.
 *
 * Usage (from project root):
 *   node scripts/preload-keys.js
 */

const { Pool } = require('pg');

// Read PG_URI from environment
require('dotenv').config();
const PG_URI = process.env.LOCAL_PG_URI || process.env.PG_URI;

// Number of keys to generate (example: 1 million)
const TOTAL_KEYS = 1000000;
// Batch size per INSERT
const BATCH_SIZE = 10000;

const pool = new Pool({ connectionString: PG_URI });

// Characters for base62 encoding (62^7 ≈ 3.5 trillion possible keys)
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const KEY_LENGTH = 7;

// Function to generate one random base62 key of length KEY_LENGTH
function generateKey() {
    let key = '';
    for (let i = 0; i < KEY_LENGTH; i++) {
        key += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return key;
}

// Generate an array of N unique keys (in memory). 
// Warning: For very large N, this may consume a lot of memory.
// Here we dedupe in a Set to avoid collisions in this batch.
function generateUniqueBatch(batchSize) {
    const set = new Set();
    while (set.size < batchSize) {
        set.add(generateKey());
    }
    return Array.from(set);
}

async function preloadKeys() {
    console.log(`Starting preload of ${TOTAL_KEYS} keys into Postgres...`);
    const client = await pool.connect();
    try {
        for (let offset = 0; offset < TOTAL_KEYS; offset += BATCH_SIZE) {
            const batch = generateUniqueBatch(BATCH_SIZE);
            // Build the VALUES string: ($1),($2),...,($N)
            const valuePlaceholders = batch.map((_, idx) => `($${idx + 1})`).join(',');
            const sql = `INSERT INTO keys(short_id) VALUES ${valuePlaceholders}
                   ON CONFLICT DO NOTHING;`;
            await client.query(sql, batch);
            console.log(`Inserted keys ${offset + 1} - ${offset + batch.length}`);
        }
        console.log('Preload complete.');
    } catch (err) {
        console.error('Error during key preload:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

preloadKeys();
