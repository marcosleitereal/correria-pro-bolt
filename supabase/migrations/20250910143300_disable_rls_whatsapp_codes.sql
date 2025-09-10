
DROP POLICY IF EXISTS "Allow public insert for verification codes" ON whatsapp_verification_codes;
DROP POLICY IF EXISTS "Users can read their own verification codes" ON whatsapp_verification_codes;
DROP POLICY IF EXISTS "Allow public access to verification codes" ON whatsapp_verification_codes;

ALTER TABLE whatsapp_verification_codes DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE whatsapp_verification_codes IS 
'WhatsApp verification codes table with RLS disabled for public authentication flow';
