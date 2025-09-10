/*
  # Add phone field to profiles table for WhatsApp authentication
  
  This migration adds a phone field to the profiles table to support
  WhatsApp-based authentication for trainers while maintaining email
  authentication for admins.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text UNIQUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

COMMENT ON COLUMN profiles.phone IS 'WhatsApp phone number for trainer authentication (international format)';
