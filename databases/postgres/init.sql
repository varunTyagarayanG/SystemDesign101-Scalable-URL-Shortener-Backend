-- url-shortener/databases/postgres/init.sql
CREATE TABLE
    IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_key VARCHAR(10) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW ()
    );