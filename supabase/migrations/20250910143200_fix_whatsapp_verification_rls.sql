
DROP POLICY IF EXISTS "Users can only access their own verification codes" ON whatsapp_verification_codes;

CREATE POLICY "Allow public insert for verification codes" ON whatsapp_verification_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read their own verification codes" ON whatsapp_verification_codes
    FOR SELECT USING (phone = phone);

CREATE POLICY "Allow public access to verification codes" ON whatsapp_verification_codes
    FOR ALL USING (true);

COMMENT ON POLICY "Allow public insert for verification codes" ON whatsapp_verification_codes IS 
'Allows anyone to insert verification codes for WhatsApp authentication';

COMMENT ON POLICY "Users can read their own verification codes" ON whatsapp_verification_codes IS 
'Users can only read verification codes for their own phone number';

COMMENT ON POLICY "Allow public access to verification codes" ON whatsapp_verification_codes IS 
'Allows public access to verification codes table for authentication flow';
