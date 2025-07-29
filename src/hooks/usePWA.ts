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
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);

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
    // Check if Service Workers are supported and not in an unsupported environment
    if ('serviceWorker' in navigator && !isUnsupportedEnvironment()) {
      try {
        console.log('🔧 PWA: Registrando Service Worker...');
        
        const reg = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        setRegistration(reg);
        console.log('✅ PWA: Service Worker registrado com sucesso');
        
        // CRÍTICO: Configurar listeners APENAS uma vez
        setupUpdateListeners(reg);
        
        // Verificar estado inicial APENAS se necessário
        checkInitialUpdateState(reg);
        
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

  const setupUpdateListeners = (reg: ServiceWorkerRegistration) => {
    // CRÍTICO: Listener para updatefound - só dispara quando há NOVA versão
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      console.log('🔄 PWA: NOVA VERSÃO DETECTADA - updatefound disparado');
      
      if (newWorker) {
        // CRÍTICO: Só rastrear se há um service worker ativo E se não é primeira instalação
        if (navigator.serviceWorker.controller && !isFirstInstall()) {
          console.log('✅ PWA: Confirmado - é uma ATUALIZAÇÃO (não primeira instalação)');
          trackNewWorkerInstallation(newWorker);
        } else {
          console.log('ℹ️ PWA: Primeira instalação ou sem controller - ignorando updatefound');
        }
      }
    });
  };

  const isFirstInstall = () => {
    // Verificar se é primeira instalação baseado em múltiplos fatores
    const hasController = !!navigator.serviceWorker.controller;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasVisitedBefore = localStorage.getItem('pwa-visited') === 'true';
    
    // Se não tem controller E não visitou antes, é primeira instalação
    if (!hasController && !hasVisitedBefore) {
      localStorage.setItem('pwa-visited', 'true');
      return true;
    }
    
    return false;
  };

  const trackNewWorkerInstallation = (newWorker: ServiceWorker) => {
    newWorker.addEventListener('statechange', () => {
      console.log('🔄 PWA: Novo worker mudou estado para:', newWorker.state);
      
      if (newWorker.state === 'installed') {
        // TRIPLA VERIFICAÇÃO: Controller ativo + não é primeira instalação + workers diferentes
        if (navigator.serviceWorker.controller && 
            !isFirstInstall() && 
            newWorker !== navigator.serviceWorker.controller) {
          console.log('✅ PWA: NOVA VERSÃO INSTALADA E PRONTA PARA ATIVAÇÃO');
          setWaitingWorker(newWorker);
          
          // ATUALIZAÇÃO AUTOMÁTICA: Aplicar imediatamente
          if (autoUpdateEnabled) {
            console.log('🔄 PWA: Aplicando atualização automática...');
            applyUpdateAutomatically(newWorker);
          }
        } else {
          console.log('ℹ️ PWA: Worker instalado mas é primeira instalação ou mesmo worker - ignorando');
        }
      }
    });
  };

  const checkInitialUpdateState = (reg: ServiceWorkerRegistration) => {
    // CRÍTICO: Só verificar se há um controller ativo E não é primeira instalação
    if (!navigator.serviceWorker.controller || isFirstInstall()) {
      console.log('ℹ️ PWA: Primeira visita - sem verificação de atualização');
      return;
    }

    // Verificar se já existe um worker waiting
    if (reg.waiting) {
      console.log('⚠️ PWA: Worker waiting encontrado no carregamento inicial');
      
      // VERIFICAÇÃO RIGOROSA: Confirmar que é diferente do controller
      if (reg.waiting !== navigator.serviceWorker.controller) {
        console.log('✅ PWA: Confirmado - worker waiting é diferente do controller');
        setWaitingWorker(reg.waiting);
        
        // ATUALIZAÇÃO AUTOMÁTICA: Aplicar imediatamente se habilitada
        if (autoUpdateEnabled) {
          console.log('🔄 PWA: Aplicando atualização automática no carregamento...');
          applyUpdateAutomatically(reg.waiting);
        }
      } else {
        console.log('ℹ️ PWA: Worker waiting é o mesmo que o controller - ignorando');
      }
    }
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

  const applyUpdateAutomatically = async (worker: ServiceWorker) => {
    try {
      console.log('🔄 PWA: Iniciando atualização automática...');
      
      // Listener para detectar quando o novo worker assumir controle
      const handleControllerChange = () => {
        console.log('✅ PWA: Atualização automática aplicada, recarregando...');
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        
        // Pequeno delay para garantir que a transição seja suave
        setTimeout(() => {
          window.location.reload();
        }, 100);
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      
      // Limpar estado
      setPwaState(prev => ({ ...prev, hasUpdate: false }));
      setWaitingWorker(null);
      
      // Ativar o novo worker
      worker.postMessage({ type: 'SKIP_WAITING' });
      
    } catch (error) {
      console.error('❌ PWA: Erro na atualização automática:', error);
    }
  };

  const updateApp = async (): Promise<void> => {
    if (waitingWorker) {
      await applyUpdateAutomatically(waitingWorker);
    }
  };

  const dismissUpdate = () => {
    console.log('🔇 PWA: Desabilitando atualizações automáticas');
    setAutoUpdateEnabled(false);
    setPwaState(prev => ({ ...prev, hasUpdate: false }));
    
    // Reabilitar após 1 hora
    setTimeout(() => {
      console.log('⏰ PWA: Reabilitando atualizações automáticas');
      setAutoUpdateEnabled(true);
    }, 60 * 60 * 1000); // 1 hora
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
    hasValidUpdate: false, // Sempre false pois atualizações são automáticas
    autoUpdateEnabled
  };
};