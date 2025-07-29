// OneSignal Configuration for Correria Pro
window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(function(OneSignal) {
  OneSignal.init({
    appId: "3a067649-6cea-4fa1-b9ea-5a512eac2c66",
    safari_web_id: "web.onesignal.auto.18140f1c-4c4a-4d8e-9c6d-8b9c5a2f1e3d",
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
              actionMessage: "Receba notificações sobre novos treinos e atualizações importantes da Correria Pro.",
              acceptButton: "Permitir Notificações",
              cancelButton: "Não, obrigado"
            }
          }
        ]
      }
    },
    welcomeNotification: {
      disable: true
    },
    subdomainName: "correria-pro"
  });

  // Configurar tags do usuário
  OneSignal.on('subscriptionChange', function(isSubscribed) {
    console.log('🔔 OneSignal: Status de inscrição alterado:', isSubscribed);
    
    if (isSubscribed) {
      // Enviar tags do usuário quando se inscrever
      const userEmail = localStorage.getItem('user_email');
      const userRole = localStorage.getItem('user_role');
      
      if (userEmail) {
        OneSignal.sendTag('email', userEmail);
      }
      
      if (userRole) {
        OneSignal.sendTag('role', userRole);
      }
      
      OneSignal.sendTag('platform', 'web');
      OneSignal.sendTag('app_version', '1.0.0');
      OneSignal.sendTag('subscription_date', new Date().toISOString());
    }
  });

  // Log de eventos para debug
  OneSignal.on('permissionChange', function(permission) {
    console.log('🔔 OneSignal: Permissão alterada:', permission);
  });

  OneSignal.on('notificationDisplay', function(event) {
    console.log('🔔 OneSignal: Notificação exibida:', event);
  });

  OneSignal.on('notificationClick', function(event) {
    console.log('🔔 OneSignal: Notificação clicada:', event);
    
    // Navegar para URL específica se fornecida
    if (event.data && event.data.url) {
      window.open(event.data.url, '_blank');
    }
  });
});

// Função global para solicitar permissão
window.requestNotificationPermission = function() {
  if (window.OneSignal) {
    OneSignal.showSlidedownPrompt();
  }
};

// Função global para enviar tags
window.sendOneSignalTags = function(tags) {
  if (window.OneSignal) {
    OneSignal.sendTags(tags);
  }
};