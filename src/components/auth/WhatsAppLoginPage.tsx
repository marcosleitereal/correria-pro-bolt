import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWhatsAppAuth } from '../../hooks/useWhatsAppAuth';
import { useAuthContext } from '../../contexts/AuthContext';

interface FormData {
  phoneNumber: string;
  verificationCode: string;
  fullName: string;
  email: string;
}

export const WhatsAppLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useAuthContext();
  const {
    loading,
    error,
    codeSent,
    phoneNumber,
    sendVerificationCode,
    verifyCode,
    registerNewUser,
    loginExistingUser,
    resetState
  } = useWhatsAppAuth();

  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    verificationCode: '',
    fullName: '',
    email: ''
  });

  const [step, setStep] = useState<'phone' | 'code' | 'register'>('phone');
  const [isNewUser, setIsNewUser] = useState(false);

  const formatPhoneDisplay = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumber.trim()) return;

    const success = await sendVerificationCode(formData.phoneNumber);
    if (success) {
      setStep('code');
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.verificationCode.trim()) return;

    const result = await verifyCode(formData.verificationCode);
    if (result.success) {
      if (result.isNewUser) {
        setIsNewUser(true);
        setStep('register');
      } else if (result.userId) {
        const loginResult = await loginExistingUser(result.userId);
        if (loginResult.success) {
          await refreshAuth();
          navigate('/dashboard');
        }
      }
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    const result = await registerNewUser({
      fullName: formData.fullName,
      email: formData.email
    });

    if (result.success) {
      await refreshAuth();
      navigate('/dashboard');
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    if (step === 'code') {
      setStep('phone');
      resetState();
    } else if (step === 'register') {
      setStep('code');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {step === 'phone' && 'Login com WhatsApp'}
              {step === 'code' && 'Verificar Código'}
              {step === 'register' && 'Completar Cadastro'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === 'phone' && 'Digite seu número do WhatsApp para receber o código de verificação'}
              {step === 'code' && `Enviamos um código de 4 dígitos para ${phoneNumber}`}
              {step === 'register' && 'Complete seus dados para finalizar o cadastro'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Número do WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+55</span>
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formatPhoneDisplay(formData.phoneNumber)}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !formData.phoneNumber.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando código...
                  </div>
                ) : (
                  'Enviar código'
                )}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de verificação
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={formData.verificationCode}
                  onChange={(e) => handleInputChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="0000"
                  maxLength={4}
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.verificationCode.length !== 4}
                  className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </div>
                  ) : (
                    'Verificar'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={handleRegistrationSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.fullName.trim() || !formData.email.trim()}
                  className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando conta...
                    </div>
                  ) : (
                    'Finalizar cadastro'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              É administrador?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Fazer login com e-mail
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
};
