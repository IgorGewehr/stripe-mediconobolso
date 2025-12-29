/**
 * Service Worker para Push Notifications
 *
 * Gerencia notificações push do sistema Médico no Bolso:
 * - Recebe push events do servidor
 * - Exibe notificações nativas do navegador
 * - Trata cliques para navegação
 */

// Versão do Service Worker (para cache invalidation se necessário)
const SW_VERSION = '1.0.0';

// Configuração padrão de notificações
const DEFAULT_NOTIFICATION_OPTIONS = {
  icon: '/logo.png',
  badge: '/ico.svg',
  vibrate: [100, 50, 100],
  requireInteraction: false,
};

// Mapeamento de categorias para ícones
const CATEGORY_ICONS = {
  appointment_reminder: '/agenda.svg',
  appointment_confirmation: '/check.svg',
  appointment_cancellation: '/agenda.svg',
  appointment_no_show: '/agenda.svg',
  lab_results: '/examescard.svg',
  medical_alert: '/reportar.svg',
  billing: '/financeiro.svg',
  nfse_issued: '/financeiro.svg',
  nfse_error: '/reportar.svg',
  glossa_received: '/financeiro.svg',
  glossa_deadline: '/reportar.svg',
  system: '/ico.svg',
};

// Mapeamento de prioridades para configurações
const PRIORITY_CONFIG = {
  critical: {
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
  },
  high: {
    requireInteraction: true,
    vibrate: [150, 75, 150],
  },
  normal: {
    requireInteraction: false,
    vibrate: [100, 50, 100],
  },
  low: {
    requireInteraction: false,
    vibrate: [50],
  },
};

/**
 * Evento de instalação do Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado - versão:', SW_VERSION);
  // Ativar imediatamente sem esperar
  self.skipWaiting();
});

/**
 * Evento de ativação do Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado - versão:', SW_VERSION);
  // Assumir controle de todas as páginas imediatamente
  event.waitUntil(clients.claim());
});

/**
 * Evento de recebimento de Push Notification
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);

  if (!event.data) {
    console.warn('[SW] Push recebido sem dados');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[SW] Erro ao parsear dados do push:', e);
    data = {
      title: 'Nova Notificação',
      message: event.data.text(),
    };
  }

  const {
    title = 'Médico no Bolso',
    message = '',
    icon,
    category = 'system',
    priority = 'normal',
    action_url,
    notification_id,
    actions = [],
  } = data;

  // Resolver ícone baseado na categoria
  const resolvedIcon = icon || CATEGORY_ICONS[category] || DEFAULT_NOTIFICATION_OPTIONS.icon;

  // Aplicar configurações de prioridade
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;

  // Construir opções da notificação
  const notificationOptions = {
    body: message,
    icon: resolvedIcon,
    badge: DEFAULT_NOTIFICATION_OPTIONS.badge,
    vibrate: priorityConfig.vibrate,
    requireInteraction: priorityConfig.requireInteraction,
    tag: notification_id || `notification-${Date.now()}`,
    renotify: true,
    data: {
      url: action_url,
      notification_id,
      category,
      timestamp: Date.now(),
    },
    // Ações customizadas (máximo 2 em mobile)
    actions: actions.slice(0, 2),
  };

  // Mostrar notificação
  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

/**
 * Evento de clique em notificação
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clique em notificação:', event);

  // Fechar a notificação
  event.notification.close();

  const { url, notification_id } = event.notification.data || {};

  // Se clicou em uma ação específica
  if (event.action) {
    console.log('[SW] Ação clicada:', event.action);
    // Tratar ações específicas aqui se necessário
  }

  // URL para navegar
  const targetUrl = url || '/';

  event.waitUntil(
    (async () => {
      // Tentar encontrar uma janela existente
      const clientList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Verificar se já existe uma janela aberta com a URL
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrlParsed = new URL(targetUrl, self.location.origin);

        if (clientUrl.pathname === targetUrlParsed.pathname) {
          // Já tem uma janela com essa URL, focar nela
          await client.focus();
          // Enviar mensagem para a janela notificando o clique
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notification_id,
            url: targetUrl,
          });
          return;
        }
      }

      // Se existe alguma janela aberta, usar a primeira
      if (clientList.length > 0) {
        const client = clientList[0];
        await client.focus();
        // Navegar para a URL alvo
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          notification_id,
          url: targetUrl,
          navigate: true,
        });
        return;
      }

      // Nenhuma janela aberta, abrir nova
      await clients.openWindow(targetUrl);
    })()
  );
});

/**
 * Evento de fechamento de notificação (dismissal)
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada:', event.notification.tag);

  const { notification_id } = event.notification.data || {};

  // Opcionalmente, notificar o servidor que a notificação foi descartada
  // Isso pode ser útil para analytics
  if (notification_id) {
    // Fire and forget - não bloquear o fechamento
    fetch('/api/v1/notifications/in-app/' + notification_id + '/dismissed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }).catch(() => {
      // Ignorar erros silenciosamente
    });
  }
});

/**
 * Evento de sincronização em background (para retry de ações)
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'mark-notifications-read') {
    event.waitUntil(syncMarkAsRead());
  }
});

/**
 * Sincroniza notificações marcadas como lidas quando offline
 */
async function syncMarkAsRead() {
  try {
    // Buscar notificações pendentes do IndexedDB
    // Implementação simplificada - em produção usar IndexedDB
    console.log('[SW] Sincronizando notificações lidas...');
  } catch (error) {
    console.error('[SW] Erro ao sincronizar:', error);
  }
}

/**
 * Recebe mensagens da página principal
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);

  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: SW_VERSION });
      break;

    case 'CHECK_SUBSCRIPTION':
      event.waitUntil(
        (async () => {
          const subscription = await self.registration.pushManager.getSubscription();
          event.ports[0]?.postMessage({
            subscribed: !!subscription,
            subscription: subscription?.toJSON(),
          });
        })()
      );
      break;

    default:
      console.log('[SW] Tipo de mensagem desconhecido:', type);
  }
});

console.log('[SW] Service Worker carregado - versão:', SW_VERSION);
