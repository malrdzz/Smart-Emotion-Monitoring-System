-- Add additional profile fields to users table
ALTER TABLE users
  ADD COLUMN course VARCHAR(255) NULL,
  ADD COLUMN gender VARCHAR(50) NULL,
  ADD COLUMN date_of_birth DATE NULL,
  ADD COLUMN education_level VARCHAR(100) NULL,
  ADD COLUMN race VARCHAR(100) NULL;