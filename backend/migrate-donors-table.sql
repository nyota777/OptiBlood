-- Migration script to update donors table to match the model
-- Run this if your donors table is missing columns

-- Add email column if it doesn't exist
ALTER TABLE donors ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add age column if it doesn't exist
ALTER TABLE donors ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add weight column if it doesn't exist
ALTER TABLE donors ADD COLUMN IF NOT EXISTS weight INTEGER;

-- Add unique constraint on email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Donors_email_key'
    ) THEN
        ALTER TABLE donors ADD CONSTRAINT Donors_email_key UNIQUE (email);
    END IF;
END $$;

-- Make email NOT NULL if there are no existing rows, or set default for existing rows
-- Note: If you have existing rows without emails, you'll need to update them first
DO $$ 
BEGIN
    -- Check if there are any NULL emails
    IF EXISTS (SELECT 1 FROM donors WHERE email IS NULL) THEN
        RAISE NOTICE 'Warning: Some donors have NULL emails. Please update them before making email NOT NULL.';
    ELSE
        -- Only make NOT NULL if no NULL values exist
        ALTER TABLE donors ALTER COLUMN email SET NOT NULL;
    END IF;
END $$;

