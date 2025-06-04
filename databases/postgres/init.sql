-- This script runs when the postgres container first initializes.
-- It will create the `keys` table if it doesn't exist.
CREATE TABLE
    IF NOT EXISTS keys (
        short_id VARCHAR(10) PRIMARY KEY,
        used BOOLEAN NOT NULL DEFAULT FALSE
    );