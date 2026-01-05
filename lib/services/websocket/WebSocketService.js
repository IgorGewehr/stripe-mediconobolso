/**
 * WebSocket Service
 *
 * Singleton service for managing WebSocket connection to doctor-server.
 * Handles connection, reconnection, authentication, and event dispatching.
 */

// Event types from backend
export const WS_EVENT_TYPES = {
  // Connection events
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  PONG: 'pong',

  // Notification events
  NOTIFICATION: 'notification',
  UNREAD_COUNT: 'unread_count',

  // Presence events
  PRESENCE_LIST: 'presence_list',
  PRESENCE_UPDATE: 'presence_update',
  PRESENCE_STATS: 'presence_stats',
  PRESENCE_SUBSCRIBED: 'presence_subscribed',

  // WhatsApp events
  WHATSAPP_STATUS: 'whatsapp_status',
  WHATSAPP_QR_CODE: 'whatsapp_qr_code',
  WHATSAPP_MESSAGE: 'whatsapp_message',
  WHATSAPP_MESSAGE_STATUS: 'whatsapp_message_status',

  // Facebook events
  FACEBOOK_STATUS: 'facebook_status',
  FACEBOOK_MESSAGE: 'facebook_message',
  FACEBOOK_MESSAGE_STATUS: 'facebook_message_status',

  // Conversation events
  CONVERSATION_NEW: 'conversation_new',
  CONVERSATION_UPDATE: 'conversation_update',
  CONVERSATION_MESSAGE: 'conversation_message',
};

// Connection states
export const WS_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

class WebSocketService {
  constructor() {
    this.ws = null;
    this.state = WS_STATE.DISCONNECTED;
    this.listeners = new Map();
    this.stateListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.token = null;
    this.doctorId = null;
    this.baseUrl = null;
    this.isIntentionalClose = false;
    this.messageQueue = [];
    this.pendingSubscriptions = new Set();
  }

  /**
   * Initialize WebSocket connection
   * @param {Object} config - Configuration object
   * @param {string} config.token - Firebase auth token
   * @param {string} config.doctorId - Doctor/tenant ID
   * @param {string} config.baseUrl - API base URL (optional)
   */
  connect({ token, doctorId, baseUrl = null }) {
    if (this.state === WS_STATE.CONNECTED || this.state === WS_STATE.CONNECTING) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    this.token = token;
    this.doctorId = doctorId;
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    this.isIntentionalClose = false;

    this._connect();
  }

  /**
   * Internal connection method
   */
  _connect() {
    try {
      this._setState(WS_STATE.CONNECTING);

      // Convert HTTP URL to WebSocket URL
      const wsUrl = this.baseUrl
        .replace(/^http/, 'ws')
        .replace(/\/api\/v1\/?$/, '');

      const fullUrl = `${wsUrl}/api/v1/ws?token=${encodeURIComponent(this.token)}`;

      console.log('[WebSocket] Connecting to:', wsUrl + '/api/v1/ws');

      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = this._handleOpen.bind(this);
      this.ws.onmessage = this._handleMessage.bind(this);
      this.ws.onclose = this._handleClose.bind(this);
      this.ws.onerror = this._handleError.bind(this);

    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this._setState(WS_STATE.ERROR);
      this._scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket open event
   */
  _handleOpen() {
    console.log('[WebSocket] Connected');
    this._setState(WS_STATE.CONNECTED);
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    // Start heartbeat
    this._startHeartbeat();

    // Process pending subscriptions
    this.pendingSubscriptions.forEach(sub => {
      this.send(sub);
    });
    this.pendingSubscriptions.clear();

    // Process queued messages
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      this.send(msg);
    }

    // Emit connected event
    this._emit(WS_EVENT_TYPES.CONNECTED, { doctorId: this.doctorId });
  }

  /**
   * Handle incoming WebSocket message
   */
  _handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      const { msg_type, payload, timestamp } = data;

      console.log('[WebSocket] Message received:', msg_type, payload);

      // Handle pong for heartbeat
      if (msg_type === 'pong') {
        this._clearHeartbeatTimeout();
        return;
      }

      // Emit to listeners
      this._emit(msg_type, payload, timestamp);

    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  _handleClose(event) {
    console.log('[WebSocket] Closed:', event.code, event.reason);

    this._stopHeartbeat();
    this.ws = null;

    if (this.isIntentionalClose) {
      this._setState(WS_STATE.DISCONNECTED);
      this._emit(WS_EVENT_TYPES.DISCONNECTED, { intentional: true });
    } else {
      this._setState(WS_STATE.RECONNECTING);
      this._emit(WS_EVENT_TYPES.DISCONNECTED, { intentional: false });
      this._scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  _handleError(error) {
    console.error('[WebSocket] Error:', error);
    this._emit(WS_EVENT_TYPES.ERROR, { error: error.message || 'Connection error' });
  }

  /**
   * Start heartbeat mechanism
   */
  _startHeartbeat() {
    this._stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.state === WS_STATE.CONNECTED) {
        this.send({ type: 'ping' });

        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('[WebSocket] Heartbeat timeout, reconnecting...');
          this.ws?.close();
        }, 10000); // 10 seconds timeout for pong
      }
    }, 25000); // Send ping every 25 seconds
  }

  /**
   * Stop heartbeat mechanism
   */
  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this._clearHeartbeatTimeout();
  }

  /**
   * Clear heartbeat timeout
   */
  _clearHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      this._setState(WS_STATE.ERROR);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.state === WS_STATE.RECONNECTING && !this.isIntentionalClose) {
        this._connect();
      }
    }, delay);
  }

  /**
   * Set connection state and notify listeners
   */
  _setState(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.stateListeners.forEach(listener => {
        try {
          listener(newState, oldState);
        } catch (e) {
          console.error('[WebSocket] State listener error:', e);
        }
      });
    }
  }

  /**
   * Emit event to listeners
   */
  _emit(eventType, payload, timestamp = null) {
    const listeners = this.listeners.get(eventType) || [];
    const allListeners = this.listeners.get('*') || [];

    const event = {
      type: eventType,
      payload,
      timestamp: timestamp || new Date().toISOString(),
    };

    [...listeners, ...allListeners].forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('[WebSocket] Event listener error:', e);
      }
    });
  }

  /**
   * Send message through WebSocket
   * @param {Object} message - Message to send
   */
  send(message) {
    if (this.state !== WS_STATE.CONNECTED || !this.ws) {
      console.log('[WebSocket] Queuing message (not connected):', message);
      this.messageQueue.push(message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      this.messageQueue.push(message);
      return false;
    }
  }

  /**
   * Subscribe to specific event type
   * @param {string} eventType - Event type to subscribe to (use '*' for all events)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback(newState, oldState)
   * @returns {Function} Unsubscribe function
   */
  onStateChange(callback) {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  /**
   * Subscribe to presence updates (for admin dashboard)
   */
  subscribePresence() {
    const msg = { type: 'subscribe_presence' };
    if (this.state === WS_STATE.CONNECTED) {
      this.send(msg);
    } else {
      this.pendingSubscriptions.add(msg);
    }
  }

  /**
   * Unsubscribe from presence updates
   */
  unsubscribePresence() {
    this.send({ type: 'unsubscribe_presence' });
    this.pendingSubscriptions.delete({ type: 'subscribe_presence' });
  }

  /**
   * Update user presence status
   * @param {string} status - 'active' | 'idle' | 'away'
   */
  updatePresence(status) {
    this.send({ type: 'update_presence', status });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    console.log('[WebSocket] Disconnecting...');
    this.isIntentionalClose = true;
    this._stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this._setState(WS_STATE.DISCONNECTED);
  }

  /**
   * Get current connection state
   */
  getState() {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.state === WS_STATE.CONNECTED;
  }

  /**
   * Update authentication token (for token refresh)
   */
  updateToken(newToken) {
    this.token = newToken;
    // If connected, reconnect with new token
    if (this.state === WS_STATE.CONNECTED) {
      this.disconnect();
      setTimeout(() => this.connect({
        token: newToken,
        doctorId: this.doctorId,
        baseUrl: this.baseUrl
      }), 100);
    }
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
