-- Add password authentication fields to user table
ALTER TABLE gg_user 
ADD COLUMN password_hash TEXT,
ADD COLUMN name TEXT;

-- Update existing users to have a name field
UPDATE gg_user 
SET name = COALESCE(display_name, split_part(email, '@', 1))
WHERE name IS NULL;

-- Make name required for new users
ALTER TABLE gg_user 
ALTER COLUMN name SET NOT NULL;
