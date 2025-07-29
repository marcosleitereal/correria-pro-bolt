import { useState, useEffect } from 'react';

interface OneSignalState {
  isInitialized: boolean;
  isSubscribed: boolean;
  playerId: string | null;
  permission: 'default' | 'granted' | 'denied';
}

export const useOneSignal = () => {
  const [oneSignalState, setOneSignalState] = useState<OneSignalState>({
    isInitialized: false,
    isSubscribed: false,
    playerId: null,
    permission: 'default'
  });

  useEffect(() => {
    initializeOneSignal();
  }, []);

  const initializeOneSignal = async () => {
    try {
      // Verificar se OneSignal já está carregado
      if (typeof window !== 'undefined' && (window as any).OneSignal) {
        await setupOneSignal();
        return;
      }

      // Carregar OneSignal SDK
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      
      script.onload = async () => {
        await setupOneSignal();
      };
      
      script.onerror = () => {
        console.error('❌ OneSignal: Erro ao carregar SDK');
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('❌ OneSignal: Erro na inicialização:', error);
    }
  };

  const setupOneSignal = async () => {
    try {
      const OneSignal = (window as any).OneSignal;
      
      if (!OneSignal) {
        console.error('❌ OneSignal: SDK não disponível');
        return;
      }

      console.log('🔔 OneSignal: Inicializando...');

      await OneSignal.init({
        appId: process.env.REACT_APP_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID',
        safari_web_id: process.env.REACT_APP_ONESIGNAL_SAFARI_WEB_ID,
        notifyButton: {
          enable: false // Usar nosso próprio botão
        },
        allowLocalhostAsSecureOrigin: true,
        autoRegister: false, // Registrar manualmente
        autoResubscribe: true,
        persistNotification: false,
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push",
                autoPrompt: false,
                text: {
                  actionMessage: "Receba notificações sobre novos treinos e atualizações importantes.",
                  acceptButton: "Permitir",
                  cancelButton: "Não, obrigado"
                }
              }
            ]
          }
        }
      });

      // Verificar estado inicial
      const permission = await OneSignal.getNotificationPermission();
      const isSubscribed = await OneSignal.isPushNotificationsEnabled();
      const playerId = await OneSignal.getUserId();

      setOneSignalState({
        isInitialized: true,
        isSubscribed,
        playerId,
        permission
      });

      console.log('✅ OneSignal: Inicializado com sucesso', {
        permission,
        isSubscribed,
        playerId
      });

      // Listeners para mudanças de estado
      OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
        console.log('🔔 OneSignal: Mudança de inscrição:', isSubscribed);
        setOneSignalState(prev => ({ ...prev, isSubscribed }));
      });

      OneSignal.on('permissionChange', (permission: string) => {
        console.log('🔔 OneSignal: Mudança de permissão:', permission);
        setOneSignalState(prev => ({ ...prev, permission: permission as any }));
      });

    } catch (error) {
      console.error('❌ OneSignal: Erro no setup:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const OneSignal = (window as any).OneSignal;
      
      if (!OneSignal || !oneSignalState.isInitialized) {
        console.warn('⚠️ OneSignal: SDK não inicializado');
        return false;
      }

      console.log('🔔 OneSignal: Solicitando permissão...');
      
      const permission = await OneSignal.showSlidedownPrompt();
      console.log('🔔 OneSignal: Resultado da permissão:', permission);
      
      return permission;
    } catch (error) {
      console.error('❌ OneSignal: Erro ao solicitar permissão:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    try {
      const OneSignal = (window as any).OneSignal;
      
      if (!OneSignal || !oneSignalState.isInitialized) {
        console.warn('⚠️ OneSignal: SDK não inicializado');
        return false;
      }

      console.log('🔔 OneSignal: Inscrevendo usuário...');
      
      await OneSignal.registerForPushNotifications();
      const isSubscribed = await OneSignal.isPushNotificationsEnabled();
      const playerId = await OneSignal.getUserId();
      
      setOneSignalState(prev => ({
        ...prev,
        isSubscribed,
        playerId
      }));

      console.log('✅ OneSignal: Usuário inscrito:', { isSubscribed, playerId });
      return isSubscribed;
    } catch (error) {
      console.error('❌ OneSignal: Erro na inscrição:', error);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    try {
      const OneSignal = (window as any).OneSignal;
      
      if (!OneSignal || !oneSignalState.isInitialized) {
        console.warn('⚠️ OneSignal: SDK não inicializado');
        return false;
      }

      console.log('🔔 OneSignal: Desinscrevendo usuário...');
      
      await OneSignal.setSubscription(false);
      
      setOneSignalState(prev => ({
        ...prev,
        isSubscribed: false,
        playerId: null
      }));

      console.log('✅ OneSignal: Usuário desinscrito');
      return true;
    } catch (error) {
      console.error('❌ OneSignal: Erro na desinscrição:', error);
      return false;
    }
  };

  const sendTag = async (key: string, value: string): Promise<boolean> => {
    try {
      const OneSignal = (window as any).OneSignal;
      
      if (!OneSignal || !oneSignalState.isInitialized) {
        console.warn('⚠️ OneSignal: SDK não inicializado');
        return false;
      }

      await OneSignal.sendTag(key, value);
      console.log('🏷️ OneSignal: Tag enviada:', { key, value });
      return true;
    } catch (error) {
      console.error('❌ OneSignal: Erro ao enviar tag:', error);
      return false;
    }
  };

  const sendTags = async (tags: Record<string, string>): Promise<boolean> => {
    try {
      const OneSignal = (window as any).OneSignal;
      
      if (!OneSignal || !oneSignalState.isInitialized) {
        console.warn('⚠️ OneSignal: SDK não inicializado');
        return false;
      }

      await OneSignal.sendTags(tags);
      console.log('🏷️ OneSignal: Tags enviadas:', tags);
      return true;
    } catch (error) {
      console.error('❌ OneSignal: Erro ao enviar tags:', error);
      return false;
    }
  };

  return {
    ...oneSignalState,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTag,
    sendTags,
    canSubscribe: oneSignalState.isInitialized && oneSignalState.permission !== 'denied'
  };
};