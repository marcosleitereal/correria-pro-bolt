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
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [hasAppliedUpdate, setHasAppliedUpdate] = useState(false);

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
    // checkVersion(); // Desabilitado temporariamente
  }, []);

  const registerServiceWorker = async () => {
    // Check if Service Workers are supported and not in an unsupported environment
    if ('serviceWorker' in navigator && !isUnsupportedEnvironment()) {
      try {
        console.log('🔧 PWA: Registrando Service Worker...');
        
        const reg = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        setRegistration(reg);
        console.log('✅ PWA: Service Worker registrado com sucesso');
        
        // Configurar listeners básicos apenas
        setupBasicListeners(reg);
        
      } catch (error) {
        if (error.message && error.message.includes('Service Workers are not yet supported')) {
          console.warn('⚠️ PWA: Service Workers não suportados neste ambiente (StackBlitz/WebContainer)');
        } else {
          console.error('❌ PWA: Erro ao registrar Service Worker:', error);
        }
      }
    } else {
      console.warn('⚠️ PWA: Service Workers não disponíveis neste ambiente');
    }
  };

  const setupBasicListeners = (reg: ServiceWorkerRegistration) => {
    // Listener básico sem auto-update
    reg.addEventListener('updatefound', () => {
      console.log('🔄 PWA: Nova versão detectada (sem auto-update)');
      
      // Apenas log, sem ação automática
      setPwaState(prev => ({ ...prev, hasUpdate: true }));
    });
  };

  const isUnsupportedEnvironment = (): boolean => {
    return (
      typeof window !== 'undefined' && (
        window.location.hostname.includes('stackblitz') ||
        window.location.hostname.includes('webcontainer') ||
        window.location.hostname.includes('local-credentialless') ||
        (window as any).__webcontainer__ ||
        navigator.userAgent.includes('WebContainer')
      )
    );
  };

  const checkIfInstalled = () => {
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
    if (waitingWorker && !hasAppliedUpdate) {
      setHasAppliedUpdate(true);
      console.log('🔄 PWA: Aplicando atualização manual...');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Recarregar após um delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const dismissUpdate = () => {
    setPwaState(prev => ({ ...prev, hasUpdate: false }));
    setWaitingWorker(null);
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
    if (!('serviceWorker' in navigator) || !registration || isUnsupportedEnvironment()) {
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
    dismissUpdate,
    requestNotificationPermission,
    showNotification,
    canInstall: pwaState.isInstallable && !pwaState.isInstalled,
    hasValidUpdate: !!waitingWorker && !hasAppliedUpdate,
    autoUpdateEnabled: false // Desabilitado para evitar loops
  };
};