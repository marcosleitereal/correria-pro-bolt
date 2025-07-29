import { useState, useEffect } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  version: string;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    version: ''
  });

  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Registrar Service Worker
    registerServiceWorker();
    
    // Detectar se é PWA instalada
    checkIfInstalled();
    
    // Listeners para eventos PWA
    setupPWAListeners();
    
    // Listeners para status online/offline
    setupNetworkListeners();
    
    // Verificar versão
    checkVersion();
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        console.log('🔧 PWA: Registrando Service Worker...');
        
        const reg = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        setRegistration(reg);
        console.log('✅ PWA: Service Worker registrado com sucesso');
        
        // Verificar atualizações
        reg.addEventListener('updatefound', () => {
          console.log('🔄 PWA: Nova versão encontrada');
          setPwaState(prev => ({ ...prev, hasUpdate: true }));
        });
        
        // Escutar mudanças de estado
        if (reg.installing) {
          trackInstalling(reg.installing);
        }
        
        if (reg.waiting) {
          setPwaState(prev => ({ ...prev, hasUpdate: true }));
        }
        
        if (reg.active) {
          console.log('✅ PWA: Service Worker ativo');
        }
        
      } catch (error) {
        console.error('❌ PWA: Erro ao registrar Service Worker:', error);
      }
    }
  };

  const trackInstalling = (worker: ServiceWorker) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Nova versão disponível
          console.log('🔄 PWA: Nova versão instalada');
          setPwaState(prev => ({ ...prev, hasUpdate: true }));
        } else {
          // Primeira instalação
          console.log('✅ PWA: Primeira instalação concluída');
        }
      }
    });
  };

  const checkIfInstalled = () => {
    // Verificar se está rodando como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');
    
    setPwaState(prev => ({ ...prev, isInstalled: isStandalone }));
    
    if (isStandalone) {
      console.log('📱 PWA: Aplicativo está instalado');
    }
  };

  const setupPWAListeners = () => {
    // Evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA: Prompt de instalação disponível');
      e.preventDefault();
      setDeferredPrompt(e as any);
      setPwaState(prev => ({ ...prev, isInstallable: true }));
    });

    // Evento appinstalled
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA: Aplicativo instalado com sucesso');
      setPwaState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false 
      }));
      setDeferredPrompt(null);
    });
  };

  const setupNetworkListeners = () => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      console.log(`🌐 PWA: Status da rede: ${isOnline ? 'Online' : 'Offline'}`);
      setPwaState(prev => ({ ...prev, isOnline }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  };

  const checkVersion = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.version) {
            setPwaState(prev => ({ ...prev, version: event.data.version }));
            console.log('📱 PWA: Versão atual:', event.data.version);
          }
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_VERSION' }, 
          [messageChannel.port2]
        );
      } catch (error) {
        console.error('❌ PWA: Erro ao verificar versão:', error);
      }
    }
  };

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('⚠️ PWA: Prompt de instalação não disponível');
      return false;
    }

    try {
      console.log('📱 PWA: Iniciando instalação...');
      await deferredPrompt.prompt();
      
      const choiceResult = await deferredPrompt.userChoice;
      console.log('📱 PWA: Escolha do usuário:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA: Usuário aceitou a instalação');
        setDeferredPrompt(null);
        setPwaState(prev => ({ ...prev, isInstallable: false }));
        return true;
      } else {
        console.log('❌ PWA: Usuário rejeitou a instalação');
        return false;
      }
    } catch (error) {
      console.error('❌ PWA: Erro na instalação:', error);
      return false;
    }
  };

  const updateApp = async (): Promise<void> => {
    if (!registration || !registration.waiting) {
      console.warn('⚠️ PWA: Nenhuma atualização disponível');
      return;
    }

    try {
      console.log('🔄 PWA: Aplicando atualização...');
      
      // Enviar mensagem para o service worker waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Recarregar a página após a atualização
      registration.addEventListener('controllerchange', () => {
        console.log('✅ PWA: Atualização aplicada, recarregando...');
        window.location.reload();
      });
      
    } catch (error) {
      console.error('❌ PWA: Erro na atualização:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('⚠️ PWA: Notificações não suportadas');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 PWA: Permissão de notificação:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ PWA: Erro ao solicitar permissão:', error);
      return false;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    if (!('serviceWorker' in navigator) || !registration) {
      console.warn('⚠️ PWA: Service Worker não disponível para notificações');
      return;
    }

    try {
      await registration.showNotification(title, {
        body: options?.body || '',
        icon: options?.icon || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100],
        ...options
      });
      
      console.log('🔔 PWA: Notificação enviada:', title);
    } catch (error) {
      console.error('❌ PWA: Erro ao enviar notificação:', error);
    }
  };

  return {
    ...pwaState,
    installApp,
    updateApp,
    requestNotificationPermission,
    showNotification,
    canInstall: pwaState.isInstallable && !pwaState.isInstalled
  };
};