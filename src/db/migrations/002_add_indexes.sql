-- Migration 002: Add indexes for filtered queries
CREATE INDEX IF NOT EXISTS idx_profiles_gender     ON profiles (LOWER(gender));
CREATE INDEX IF NOT EXISTS idx_profiles_country_id ON profiles (LOWER(country_id));
CREATE INDEX IF NOT EXISTS idx_profiles_age_group  ON profiles (LOWER(age_group));
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at DESC);