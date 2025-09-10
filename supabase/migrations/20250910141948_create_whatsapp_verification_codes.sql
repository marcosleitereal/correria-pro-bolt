/*
  # Create WhatsApp verification codes table
  
  This table stores temporary verification codes sent via WhatsApp
  for the authentication process.
*/

CREATE TABLE IF NOT EXISTS whatsapp_verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_phone ON whatsapp_verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_codes_expires_at ON whatsapp_verification_codes(expires_at);

ALTER TABLE whatsapp_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own verification codes" ON whatsapp_verification_codes
  FOR ALL USING (phone = current_setting('request.jwt.claims', true)::json->>'phone');

CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM whatsapp_verification_codes 
  WHERE expires_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_verification_codes() IS 
'Function to clean up expired WhatsApp verification codes. Should be called periodically.';

COMMENT ON TABLE whatsapp_verification_codes IS 'Temporary storage for WhatsApp verification codes';
COMMENT ON COLUMN whatsapp_verification_codes.phone IS 'Phone number in international format';
COMMENT ON COLUMN whatsapp_verification_codes.code IS '4-digit verification code';
COMMENT ON COLUMN whatsapp_verification_codes.expires_at IS 'When the code expires (10 minutes from creation)';
COMMENT ON COLUMN whatsapp_verification_codes.used_at IS 'When the code was successfully used';
