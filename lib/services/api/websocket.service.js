/**
 * WebSocket Service - Cliente WebSocket para comunicação real-time
 *
 * Este serviço gerencia a conexão WebSocket com o backend Rust,
 * incluindo autenticação via Firebase JWT, reconexão automática,
 * e event handling.
 */

import { auth } from '@/lib/config/firebase.config';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1').replace(/^http/, 'ws');

/**
 * Classe para gerenciar conexão WebSocket
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Initial delay
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.pingInterval = null;
    this.pingIntervalMs = 25000; // 25 seconds (server expects within 30s)

    // Event listeners
    this.eventListeners = new Map();

    // Subscriptions
    this.subscriptions = new Set();

    // Auto reconnect flag
    this.shouldReconnect = true;

    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
  }

  /**
   * Obtém o token JWT do Firebase
   */
  async getAuthToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    return user.getIdToken();
  }

  /**
   * Conecta ao WebSocket
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnected || this.isConnecting) {
      console.log('[WS] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      const token = await this.getAuthToken();
      const wsUrl = `${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}`;

      console.log('[WS] Connecting to WebSocket...');

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] Connected successfully');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Start ping interval
        this.startPingInterval();

        // Re-subscribe to previous subscriptions
        this.resubscribe();

        // Emit connect event
        this.emit('connected', { timestamp: new Date() });
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Connection closed', event.code, event.reason);
        this.handleDisconnect();
      };

      this.ws.onerror = (event) => {
        console.error('[WS] WebSocket error - connection failed or interrupted');
        console.error('[WS] WebSocket readyState:', this.ws?.readyState);
        console.error('[WS] Target URL:', event.target?.url || 'unknown');
        this.emit('error', { message: 'WebSocket connection error', readyState: this.ws?.readyState });
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
    } catch (error) {
      console.error('[WS] Failed to connect:', error);
      this.isConnecting = false;
      this.handleDisconnect();
    }
  }

  /**
   * Desconecta do WebSocket
   */
  disconnect() {
    console.log('[WS] Disconnecting...');
    this.shouldReconnect = false;
    this.stopPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.subscriptions.clear();

    this.emit('disconnected', { timestamp: new Date() });
  }

  /**
   * Lida com desconexão
   */
  handleDisconnect() {
    this.isConnected = false;
    this.isConnecting = false;
    this.stopPingInterval();

    this.emit('disconnected', { timestamp: new Date() });

    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Agenda reconexão com exponential backoff
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay,
    });

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Inicia o intervalo de ping
   */
  startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, this.pingIntervalMs);
  }

  /**
   * Para o intervalo de ping
   */
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Envia ping para manter conexão ativa
   */
  sendPing() {
    if (this.isConnected) {
      this.send({ type: 'ping' });
    }
  }

  /**
   * Envia mensagem pelo WebSocket
   * @param {Object} data - Dados para enviar
   */
  send(data) {
    if (!this.ws || !this.isConnected) {
      console.warn('[WS] Cannot send message: not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[WS] Failed to send message:', error);
      return false;
    }
  }

  /**
   * Processa mensagem recebida
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      const { msg_type, payload, timestamp } = message;

      // Handle system messages
      if (msg_type === 'pong') {
        return; // Ignore pong responses
      }

      if (msg_type === 'connected') {
        console.log('[WS] Server confirmed connection for user:', payload?.user_id);
        return;
      }

      if (msg_type === 'error') {
        console.error('[WS] Server error:', payload?.message);
        this.emit('server_error', payload);
        return;
      }

      // Emit event to listeners
      this.emit(msg_type, { ...payload, timestamp });

      // Also emit a generic 'message' event
      this.emit('message', { type: msg_type, payload, timestamp });

    } catch (error) {
      console.error('[WS] Failed to parse message:', error);
    }
  }

  /**
   * Re-subscreve para subscriptions anteriores após reconexão
   */
  resubscribe() {
    for (const subscription of this.subscriptions) {
      console.log('[WS] Resubscribing to:', subscription);
      this.send({ type: subscription });
    }
  }

  // =========================================================================
  // Subscription Methods
  // =========================================================================

  /**
   * Subscreve para updates de presença (admin dashboard)
   */
  subscribePresence() {
    this.subscriptions.add('subscribe_presence');
    if (this.isConnected) {
      this.send({ type: 'subscribe_presence' });
    }
  }

  /**
   * Cancela subscription de presença
   */
  unsubscribePresence() {
    this.subscriptions.delete('subscribe_presence');
    if (this.isConnected) {
      this.send({ type: 'unsubscribe_presence' });
    }
  }

  // =========================================================================
  // Event Handling
  // =========================================================================

  /**
   * Adiciona listener para um evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função callback
   * @returns {Function} Função para remover o listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Remove listener de um evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função callback
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emite um evento para todos os listeners
   * @param {string} event - Nome do evento
   * @param {any} data - Dados do evento
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WS] Error in event listener for '${event}':`, error);
        }
      }
    }
  }

  /**
   * Remove todos os listeners de um evento
   * @param {string} event - Nome do evento (opcional, se não fornecido remove todos)
   */
  removeAllListeners(event) {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  // =========================================================================
  // Status Methods
  // =========================================================================

  /**
   * Retorna se está conectado
   */
  getIsConnected() {
    return this.isConnected;
  }

  /**
   * Retorna status da conexão
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions),
    };
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
export { WebSocketService, WS_BASE_URL };
