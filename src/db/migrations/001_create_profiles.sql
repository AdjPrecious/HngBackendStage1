-- Migration 001: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id                  TEXT        PRIMARY KEY,
  name                TEXT        NOT NULL UNIQUE,
  gender              TEXT,
  gender_probability  NUMERIC(5,4),
  sample_size         INTEGER,
  age                 INTEGER,
  age_group           TEXT,
  country_id          TEXT,
  country_probability NUMERIC(5,4),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);