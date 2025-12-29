/**
 * Presence Service - Gerenciamento de presença de usuários
 *
 * Este serviço substitui o Firebase Firestore para tracking de presença,
 * usando REST API para heartbeat e WebSocket para updates em tempo real.
 *
 * Mantém compatibilidade com a interface do presenceService antigo (Firebase).
 */

import apiService from './apiService';
import websocketService from './websocket.service';

// Configuração
const HEARTBEAT_INTERVAL = 30000; // 30 segundos
const FALLBACK_POLL_INTERVAL = 30000; // 30 segundos de polling se WS falhar

/**
 * Classe para gerenciar presença de usuários
 */
class PresenceService {
  constructor() {
    this.userId = null;
    this.isActive = false;
    this.heartbeatInterval = null;
    this.fallbackPollInterval = null;
    this.currentStatus = 'active';

    // Cache de usuários online
    this.onlineUsersCache = [];
    this.statsCache = null;
    this.lastUpdate = null;

    // Listeners
    this.onlineUsersListeners = new Set();
    this.userPresenceListeners = new Map(); // userId -> Set<callback>

    // Bind methods
    this.startPresence = this.startPresence.bind(this);
    this.stopPresence = this.stopPresence.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnlineStatusChange = this.handleOnlineStatusChange.bind(this);

    // Setup WebSocket listeners
    this.setupWebSocketListeners();
  }

  /**
   * Configura listeners do WebSocket
   */
  setupWebSocketListeners() {
    // Quando receber lista de presença
    websocketService.on('presence_list', (data) => {
      this.handlePresenceList(data);
    });

    // Quando receber update individual
    websocketService.on('presence_update', (data) => {
      this.handlePresenceUpdate(data);
    });

    // Quando receber stats
    websocketService.on('presence_stats', (data) => {
      this.handlePresenceStats(data);
    });

    // Quando subscription for confirmada
    websocketService.on('presence_subscribed', () => {
      console.log('[Presence] Subscribed to presence updates');
      // Fetch initial data via REST
      this.fetchPresenceData();
    });

    // Quando WebSocket reconectar
    websocketService.on('connected', () => {
      if (this.isActive) {
        console.log('[Presence] WebSocket reconnected, re-registering presence');
        this.sendHeartbeat();
      }
    });

    // Quando WebSocket desconectar
    websocketService.on('disconnected', () => {
      console.log('[Presence] WebSocket disconnected');
      // Start fallback polling if active
      if (this.isActive && this.onlineUsersListeners.size > 0) {
        this.startFallbackPolling();
      }
    });
  }

  /**
   * Processa lista de presença recebida
   */
  handlePresenceList(data) {
    const { users, stats } = data;
    this.onlineUsersCache = this.convertUsersToFrontendFormat(users || []);
    this.statsCache = stats;
    this.lastUpdate = new Date();
    this.notifyOnlineUsersListeners();
  }

  /**
   * Processa update individual de presença
   */
  handlePresenceUpdate(data) {
    const { event, user } = data;
    const frontendUser = this.convertUserToFrontendFormat(user);

    if (event === 'online' || event === 'heartbeat' || event === 'status_change') {
      // Update or add user
      const index = this.onlineUsersCache.findIndex(u => u.userId === user.user_id);
      if (index >= 0) {
        this.onlineUsersCache[index] = frontendUser;
      } else if (event === 'online') {
        this.onlineUsersCache.push(frontendUser);
      }
    } else if (event === 'offline') {
      // Remove user
      this.onlineUsersCache = this.onlineUsersCache.filter(u => u.userId !== user.user_id);
    }

    this.lastUpdate = new Date();
    this.notifyOnlineUsersListeners();

    // Notify specific user listeners
    const userListeners = this.userPresenceListeners.get(user.user_id);
    if (userListeners) {
      const isOnline = event !== 'offline';
      userListeners.forEach(callback => callback(isOnline, frontendUser));
    }
  }

  /**
   * Processa stats de presença
   */
  handlePresenceStats(data) {
    this.statsCache = data;
    this.lastUpdate = new Date();
  }

  /**
   * Converte formato do backend para frontend
   */
  convertUserToFrontendFormat(backendUser) {
    const sessionStart = backendUser.session_start
      ? new Date(backendUser.session_start)
      : new Date();

    const lastSeen = backendUser.last_seen
      ? new Date(backendUser.last_seen)
      : new Date();

    // Calculate session duration in minutes
    const sessionDuration = backendUser.session_duration_secs
      ? Math.floor(backendUser.session_duration_secs / 60)
      : Math.floor((Date.now() - sessionStart.getTime()) / 60000);

    return {
      id: backendUser.user_id,
      odId: backendUser.user_id,
      isOnline: backendUser.is_online !== false,
      lastSeen: lastSeen,
      sessionStart: sessionStart,
      userAgent: backendUser.user_agent || '',
      platform: backendUser.platform || 'web',
      connectionType: 'websocket',
      status: backendUser.status || 'active',
      connectionQuality: backendUser.connection_quality || 'Good',
      sessionDuration: sessionDuration,
      // User info (if available)
      userName: backendUser.user_name,
      userEmail: backendUser.user_email,
    };
  }

  /**
   * Converte lista de usuários
   */
  convertUsersToFrontendFormat(users) {
    return users.map(u => this.convertUserToFrontendFormat(u));
  }

  // =========================================================================
  // Public API (Compatible with old presenceService)
  // =========================================================================

  /**
   * Inicia tracking de presença
   * @param {string} userId - ID do usuário
   * @param {Object} userData - Dados adicionais do usuário
   */
  async startPresence(userId, userData = {}) {
    if (this.isActive) {
      console.log('[Presence] Already active');
      return;
    }

    console.log('[Presence] Starting presence tracking for user:', userId);
    this.userId = userId;
    this.isActive = true;
    this.currentStatus = 'active';

    // Connect WebSocket
    await websocketService.connect();

    // Send initial heartbeat
    await this.sendHeartbeat();

    // Start heartbeat interval
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);

    // Setup browser event listeners
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStatusChange);
      window.addEventListener('offline', this.handleOnlineStatusChange);
      window.addEventListener('beforeunload', () => this.stopPresence());
    }
  }

  /**
   * Para tracking de presença
   */
  async stopPresence() {
    if (!this.isActive) return;

    console.log('[Presence] Stopping presence tracking');
    this.isActive = false;

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.stopFallbackPolling();

    // Remove browser event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineStatusChange);
      window.removeEventListener('offline', this.handleOnlineStatusChange);
    }

    // Mark as offline via API
    try {
      await apiService.delete('/presence');
    } catch (error) {
      console.error('[Presence] Failed to mark offline:', error);
    }

    // Disconnect WebSocket
    websocketService.disconnect();

    this.userId = null;
    this.onlineUsersCache = [];
    this.statsCache = null;
  }

  /**
   * Envia heartbeat para o servidor
   */
  async sendHeartbeat() {
    if (!this.isActive) return;

    try {
      await apiService.post('/presence/heartbeat', {
        status: this.currentStatus,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 200) : '',
        platform: this.detectPlatform(),
      });
    } catch (error) {
      console.error('[Presence] Failed to send heartbeat:', error);
    }
  }

  /**
   * Detecta a plataforma do usuário
   */
  detectPlatform() {
    if (typeof navigator === 'undefined') return 'server';

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mobile')) return 'mobile';
    if (ua.includes('tablet')) return 'tablet';
    return 'web';
  }

  /**
   * Handler para mudança de visibilidade da página
   */
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.currentStatus = 'active';
      this.sendHeartbeat();
    } else {
      this.currentStatus = 'idle';
      this.sendHeartbeat();
    }
  }

  /**
   * Handler para mudança de status de conexão
   */
  handleOnlineStatusChange() {
    if (navigator.onLine) {
      console.log('[Presence] Browser back online, reconnecting...');
      websocketService.connect();
      this.sendHeartbeat();
    }
  }

  /**
   * Obtém lista de usuários online com callback (real-time)
   * @param {Function} callback - Função chamada quando houver mudanças
   * @param {Object} options - Opções
   * @returns {Function} Função para cancelar subscription
   */
  getOnlineUsers(callback, options = {}) {
    // Add listener
    this.onlineUsersListeners.add(callback);

    // Connect WebSocket and subscribe to presence if not already
    if (!websocketService.getIsConnected()) {
      websocketService.connect().then(() => {
        websocketService.subscribePresence();
      });
    } else {
      websocketService.subscribePresence();
    }

    // Fetch initial data
    this.fetchPresenceData().then(() => {
      callback(this.onlineUsersCache);
    });

    // Return unsubscribe function
    return () => {
      this.onlineUsersListeners.delete(callback);

      // If no more listeners, unsubscribe from presence
      if (this.onlineUsersListeners.size === 0) {
        websocketService.unsubscribePresence();
        this.stopFallbackPolling();
      }
    };
  }

  /**
   * Verifica se um usuário específico está online
   * @param {string} userId - ID do usuário
   * @param {Function} callback - Função chamada quando houver mudanças
   * @returns {Function} Função para cancelar subscription
   */
  isUserOnline(userId, callback) {
    // Add listener
    if (!this.userPresenceListeners.has(userId)) {
      this.userPresenceListeners.set(userId, new Set());
    }
    this.userPresenceListeners.get(userId).add(callback);

    // Check current cache
    const user = this.onlineUsersCache.find(u => u.userId === userId);
    callback(!!user, user || null);

    // Return unsubscribe function
    return () => {
      const listeners = this.userPresenceListeners.get(userId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.userPresenceListeners.delete(userId);
        }
      }
    };
  }

  /**
   * Obtém estatísticas de presença
   * @returns {Promise<Object>}
   */
  async getPresenceStats() {
    try {
      const stats = await apiService.get('/presence/stats');
      return {
        onlineCount: stats.online_count,
        activeUsers: stats.active_users,
        idleUsers: stats.idle_users,
        awayUsers: stats.away_users,
        avgSessionTime: Math.floor(stats.avg_session_time_secs / 60), // Convert to minutes
        timestamp: new Date(stats.timestamp || Date.now()),
      };
    } catch (error) {
      console.error('[Presence] Failed to get stats:', error);
      return this.statsCache || {
        onlineCount: 0,
        activeUsers: 0,
        idleUsers: 0,
        awayUsers: 0,
        avgSessionTime: 0,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Atualiza status de presença
   * @param {string} status - 'active', 'idle', ou 'away'
   */
  async updateStatus(status) {
    this.currentStatus = status;

    try {
      await apiService.patch('/presence/status', { status });
    } catch (error) {
      console.error('[Presence] Failed to update status:', error);
    }
  }

  // =========================================================================
  // Internal Methods
  // =========================================================================

  /**
   * Busca dados de presença via REST API
   */
  async fetchPresenceData() {
    try {
      const data = await apiService.get('/presence/all');
      this.onlineUsersCache = this.convertUsersToFrontendFormat(data.users || []);
      this.statsCache = data.stats;
      this.lastUpdate = new Date();
      this.notifyOnlineUsersListeners();
    } catch (error) {
      console.error('[Presence] Failed to fetch presence data:', error);
    }
  }

  /**
   * Notifica todos os listeners de usuários online
   */
  notifyOnlineUsersListeners() {
    for (const callback of this.onlineUsersListeners) {
      try {
        callback(this.onlineUsersCache);
      } catch (error) {
        console.error('[Presence] Error in listener:', error);
      }
    }
  }

  /**
   * Inicia polling de fallback quando WebSocket falha
   */
  startFallbackPolling() {
    if (this.fallbackPollInterval) return;

    console.log('[Presence] Starting fallback polling');
    this.fallbackPollInterval = setInterval(() => {
      this.fetchPresenceData();
    }, FALLBACK_POLL_INTERVAL);
  }

  /**
   * Para polling de fallback
   */
  stopFallbackPolling() {
    if (this.fallbackPollInterval) {
      clearInterval(this.fallbackPollInterval);
      this.fallbackPollInterval = null;
    }
  }

  /**
   * Cleanup - remove todos os listeners
   */
  cleanup() {
    this.stopPresence();
    this.onlineUsersListeners.clear();
    this.userPresenceListeners.clear();
    websocketService.removeAllListeners();
  }
}

// Singleton instance
const presenceService = new PresenceService();

// Export as default (singleton)
export default presenceService;

// Also export class for testing
export { PresenceService };
