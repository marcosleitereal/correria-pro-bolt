import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface WhatsAppAuthState {
  loading: boolean;
  error: string | null;
  codeSent: boolean;
  phoneNumber: string;
}

interface VerificationResult {
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  error?: string;
}

interface UserRegistrationData {
  fullName: string;
  email: string;
}

export const useWhatsAppAuth = () => {
  const [state, setState] = useState<WhatsAppAuthState>({
    loading: false,
    error: null,
    codeSent: false,
    phoneNumber: ''
  });

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('53') && cleaned.length === 11) {
      return `+55${cleaned}`;
    }
    
    if (cleaned.startsWith('55') && cleaned.length === 13) {
      return `+${cleaned}`;
    }
    
    return `+55${cleaned}`;
  };

  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationCode = async (phoneNumber: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: dbError } = await supabase
        .from('whatsapp_verification_codes')
        .insert({
          phone: formattedPhone,
          code,
          expires_at: expiresAt
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log(`🚀 Sending WhatsApp code ${code} to ${formattedPhone}`);
      
      const response = await fetch('http://localhost:3000/api/wa/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: formattedPhone.replace('+', ''),
          code: code,
          templateId: 'verificacao'
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to send WhatsApp message');
      }

      if (!responseData.success) {
        throw new Error(responseData.error || 'WhatsApp message not sent');
      }

      console.log(`✅ WhatsApp message sent successfully: ${responseData.data?.messageId}`);

      setState(prev => ({
        ...prev,
        loading: false,
        codeSent: true,
        phoneNumber: formattedPhone
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao enviar código de verificação'
      }));
      return false;
    }
  };

  const verifyCode = async (code: string): Promise<VerificationResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: verificationData, error: verifyError } = await supabase
        .from('whatsapp_verification_codes')
        .select('*')
        .eq('phone', state.phoneNumber)
        .eq('code', code)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (verifyError || !verificationData) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Código inválido ou expirado'
        }));
        return { success: false, isNewUser: false, error: 'Código inválido ou expirado' };
      }

      await supabase
        .from('whatsapp_verification_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', verificationData.id);

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', state.phoneNumber)
        .single();

      setState(prev => ({ ...prev, loading: false }));

      if (existingProfile) {
        return {
          success: true,
          isNewUser: false,
          userId: existingProfile.id
        };
      } else {
        return {
          success: true,
          isNewUser: true
        };
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao verificar código'
      }));
      return { success: false, isNewUser: false, error: error.message };
    }
  };

  const registerNewUser = async (userData: UserRegistrationData): Promise<{ success: boolean; userId?: string; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: Math.random().toString(36).substring(2, 15),
        options: {
          data: {
            full_name: userData.fullName,
            phone: state.phoneNumber
          }
        }
      });

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: state.phoneNumber,
          full_name: userData.fullName,
          email: userData.email
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.warn('Profile update error:', profileError);
      }

      setState(prev => ({ ...prev, loading: false }));

      return {
        success: true,
        userId: authData.user.id
      };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao registrar usuário'
      }));
      return { success: false, error: error.message };
    }
  };

  const loginExistingUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profile?.email) {
        throw new Error('Profile not found');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: Math.random().toString(36).substring(2, 15)
      });

      if (signInError) {
        const { error: authError } = await supabase.auth.signUp({
          email: profile.email,
          password: Math.random().toString(36).substring(2, 15)
        });

        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }
      }

      setState(prev => ({ ...prev, loading: false }));
      return { success: true };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao fazer login'
      }));
      return { success: false, error: error.message };
    }
  };

  const resetState = () => {
    setState({
      loading: false,
      error: null,
      codeSent: false,
      phoneNumber: ''
    });
  };

  return {
    ...state,
    sendVerificationCode,
    verifyCode,
    registerNewUser,
    loginExistingUser,
    resetState
  };
};
