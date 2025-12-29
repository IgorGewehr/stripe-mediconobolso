// lib/presenceService.js
// @deprecated Este serviço foi migrado para usar o backend local.
// Use `presenceApiService` de '@/lib/services/api' ao invés deste.
//
// Este arquivo agora é um wrapper de compatibilidade que redireciona
// para o novo serviço baseado em REST API + WebSocket.

import presenceApiService from './services/api/presence.service';

/**
 * @deprecated Use `presenceApiService` de '@/lib/services/api' ao invés deste.
 *
 * Este wrapper existe apenas para manter compatibilidade com código antigo.
 * Novas implementações devem usar diretamente o presenceApiService.
 */
class PresenceServiceWrapper {
    constructor() {
        console.warn(
            '[DEPRECATED] presenceService está deprecado. ' +
            'Use presenceApiService de "@/lib/services/api" ao invés.'
        );
    }

    /**
     * @deprecated Use presenceApiService.startPresence()
     */
    async startPresence(userId, userData = {}) {
        console.warn('[DEPRECATED] presenceService.startPresence() - use presenceApiService.startPresence()');
        return presenceApiService.startPresence(userId, userData);
    }

    /**
     * @deprecated Use presenceApiService.stopPresence()
     */
    async stopPresence() {
        console.warn('[DEPRECATED] presenceService.stopPresence() - use presenceApiService.stopPresence()');
        return presenceApiService.stopPresence();
    }

    /**
     * @deprecated Use presenceApiService.getOnlineUsers()
     */
    getOnlineUsers(callback, options = {}) {
        console.warn('[DEPRECATED] presenceService.getOnlineUsers() - use presenceApiService.getOnlineUsers()');
        return presenceApiService.getOnlineUsers(callback, options);
    }

    /**
     * @deprecated Use presenceApiService.isUserOnline()
     */
    isUserOnline(userId, callback) {
        console.warn('[DEPRECATED] presenceService.isUserOnline() - use presenceApiService.isUserOnline()');
        return presenceApiService.isUserOnline(userId, callback);
    }

    /**
     * @deprecated Use presenceApiService.getPresenceStats()
     */
    async getPresenceStats() {
        console.warn('[DEPRECATED] presenceService.getPresenceStats() - use presenceApiService.getPresenceStats()');
        return presenceApiService.getPresenceStats();
    }

    /**
     * @deprecated Use presenceApiService.updateStatus()
     */
    async updateStatus(status) {
        console.warn('[DEPRECATED] presenceService.updateStatus() - use presenceApiService.updateStatus()');
        return presenceApiService.updateStatus(status);
    }

    /**
     * @deprecated Não necessário no novo serviço
     */
    cleanupListeners() {
        console.warn('[DEPRECATED] presenceService.cleanupListeners() - não necessário no novo serviço');
        // No-op - handled automatically in presenceApiService
    }

    /**
     * @deprecated Não necessário no novo serviço
     */
    async cleanupStaleSessions() {
        console.warn('[DEPRECATED] presenceService.cleanupStaleSessions() - handled by backend');
        // No-op - handled by backend
    }
}

// Export wrapper as default (singleton behavior)
const presenceServiceWrapper = new PresenceServiceWrapper();
export default presenceServiceWrapper;

// ============================================================================
// CÓDIGO ANTIGO ABAIXO (MANTIDO PARA REFERÊNCIA, MAS NÃO UTILIZADO)
// ============================================================================

/*
// CÓDIGO FIREBASE ORIGINAL - DEPRECATED
// Mantido apenas para referência histórica

import {
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    collection,
    query,
    where,
    serverTimestamp,
    updateDoc,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import { firestore } from './firebase';

class OptimizedPresenceService {
    constructor() {
        this.presenceRef = null;
        this.heartbeatInterval = null;
        this.isOnline = false;
        this.userId = null;
        this.listeners = new Map();
        this.lastHeartbeat = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isCleaningUp = false;
    }

    // ====================================================
    // INICIALIZAÇÃO E CONFIGURAÇÃO
    // ====================================================

    async startPresence(userId, userData = {}) {
        if (this.isOnline && this.userId === userId) {
            console.log('✅ Presença já ativa para este usuário');
            return Promise.resolve();
        }

        // Cleanup qualquer presença anterior
        if (this.isOnline) {
            await this.stopPresence();
        }

        try {
            this.userId = userId;
            this.presenceRef = doc(firestore, 'presence', userId);
            this.retryCount = 0;

            // Dados otimizados da presença
            const presenceData = {
                userId,
                isOnline: true,
                lastSeen: serverTimestamp(),
                sessionStart: serverTimestamp(),
                userAgent: this.getUserAgent(),
                platform: this.getPlatform(),
                connectionType: this.getConnectionType(),
                ...userData
            };

            // Usar batch para operações atômicas
            const batch = writeBatch(firestore);

            // Documento de presença
            batch.set(this.presenceRef, presenceData);

            // Atualizar usuário
            const userRef = doc(firestore, 'users', userId);
            batch.update(userRef, {
                lastLogin: new Date(),
                lastLoginTimestamp: serverTimestamp(),
                lastUserAgent: this.getUserAgent(),
                isCurrentlyOnline: true,
                presenceSessionId: Date.now() // ID único da sessão
            });

            await batch.commit();
            this.isOnline = true;

            // Configurar sistema de monitoramento
            this.startAdvancedHeartbeat();
            this.setupConnectionMonitoring();
            this.setupBeforeUnload();

            console.log('✅ Sistema de presença otimizado iniciado para:', userId);
            return Promise.resolve();
        } catch (error) {
            console.error('❌ Erro ao iniciar presença:', error);
            await this.handlePresenceError(error);
            return Promise.reject(error);
        }
    }

    // ====================================================
    // SISTEMA DE HEARTBEAT AVANÇADO
    // ====================================================

    startAdvancedHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(async () => {
            if (!this.presenceRef || !this.isOnline || this.isCleaningUp) return;

            try {
                const now = Date.now();

                // Evitar heartbeats muito frequentes
                if (this.lastHeartbeat && (now - this.lastHeartbeat) < 25000) {
                    return;
                }

                await updateDoc(this.presenceRef, {
                    lastSeen: serverTimestamp(),
                    heartbeat: now,
                    connectionQuality: this.getConnectionQuality()
                });

                this.lastHeartbeat = now;
                this.retryCount = 0; // Reset retry count em sucesso

            } catch (error) {
                console.warn('⚠️ Erro no heartbeat:', error);
                await this.handleHeartbeatError(error);
            }
        }, 30000); // 30 segundos
    }

    async handleHeartbeatError(error) {
        this.retryCount++;

        if (this.retryCount >= this.maxRetries) {
            console.error('❌ Muitas falhas no heartbeat, reiniciando presença...');
            await this.restartPresence();
        } else {
            console.log(`🔄 Tentativa ${this.retryCount}/${this.maxRetries} de heartbeat`);
        }
    }

    async restartPresence() {
        const currentUserId = this.userId;
        const isCurrentlyOnline = this.isOnline;

        if (isCurrentlyOnline && currentUserId) {
            await this.stopPresence();
            // Pequeno delay antes de reiniciar
            setTimeout(() => {
                this.startPresence(currentUserId);
            }, 2000);
        }
    }

    // ====================================================
    // MONITORAMENTO DE CONEXÃO
    // ====================================================

    setupConnectionMonitoring() {
        // Monitor de conexão de rede
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));

        // Monitor de visibilidade da página
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        // Monitor de foco da janela
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
    }

    async handleOnline() {
        console.log('🌐 Conexão restaurada');
        if (this.userId && !this.isOnline) {
            await this.startPresence(this.userId);
        }
    }

    async handleOffline() {
        console.log('📴 Conexão perdida');
        // Não parar presença imediatamente, esperar reconexão
    }

    handleVisibilityChange() {
        if (document.hidden) {
            console.log('👁️ Página oculta');
            this.updatePresenceStatus('away');
        } else {
            console.log('👁️ Página visível');
            this.updatePresenceStatus('active');
        }
    }

    handleWindowFocus() {
        if (this.userId) {
            this.updatePresenceStatus('active');
        }
    }

    handleWindowBlur() {
        if (this.userId) {
            this.updatePresenceStatus('idle');
        }
    }

    async updatePresenceStatus(status) {
        if (!this.presenceRef || !this.isOnline) return;

        try {
            await updateDoc(this.presenceRef, {
                status: status,
                lastSeen: serverTimestamp()
            });
        } catch (error) {
            console.warn('⚠️ Erro ao atualizar status:', error);
        }
    }

    // ====================================================
    // SISTEMA DE CLEANUP MELHORADO
    // ====================================================

    async stopPresence() {
        if (this.isCleaningUp) return;
        this.isCleaningUp = true;

        try {
            // Limpar intervals
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }

            // Cleanup de listeners
            this.cleanupListeners();

            if (this.userId && this.isOnline) {
                // Usar batch para operações atômicas
                const batch = writeBatch(firestore);

                // Atualizar usuário
                const userRef = doc(firestore, 'users', this.userId);
                batch.update(userRef, {
                    isCurrentlyOnline: false,
                    lastSeen: new Date(),
                    sessionEndedAt: serverTimestamp()
                });

                // Deletar presença
                if (this.presenceRef) {
                    batch.delete(this.presenceRef);
                }

                await batch.commit();
            }

            // Reset state
            this.isOnline = false;
            this.userId = null;
            this.presenceRef = null;
            this.lastHeartbeat = null;
            this.retryCount = 0;

            console.log('✅ Sistema de presença parado com cleanup completo');
        } catch (error) {
            console.error('❌ Erro ao parar presença:', error);
        } finally {
            this.isCleaningUp = false;
        }
    }

    cleanupListeners() {
        this.listeners.forEach((unsubscribe, key) => {
            try {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            } catch (error) {
                console.warn(`⚠️ Erro ao limpar listener ${key}:`, error);
            }
        });
        this.listeners.clear();
    }

    setupBeforeUnload() {
        const cleanup = () => {
            // Usar sendBeacon para garantir envio
            if (this.userId && navigator.sendBeacon) {
                const data = JSON.stringify({
                    userId: this.userId,
                    action: 'offline',
                    timestamp: Date.now()
                });

                navigator.sendBeacon('/api/presence-cleanup', data);
            }
        };

        // Múltiplos eventos para garantir cleanup
        ['beforeunload', 'pagehide', 'unload'].forEach(event => {
            window.addEventListener(event, cleanup, { once: true });
        });
    }

    // ====================================================
    // MONITORAMENTO E ESTATÍSTICAS OTIMIZADAS
    // ====================================================

    getOnlineUsers(callback, options = {}) {
        const {
            includeStatus = false,
            filterByRole = null,
            maxUsers = 100
        } = options;

        let presenceQuery = query(
            collection(firestore, 'presence'),
            where('isOnline', '==', true)
        );

        if (filterByRole) {
            presenceQuery = query(presenceQuery, where('role', '==', filterByRole));
        }

        const listenerId = `onlineUsers_${Date.now()}`;

        const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
            const onlineUsers = [];
            let count = 0;

            snapshot.forEach(doc => {
                if (count >= maxUsers) return;

                const data = doc.data();
                onlineUsers.push({
                    id: doc.id,
                    ...data,
                    // Calcular tempo de sessão
                    sessionDuration: this.calculateSessionDuration(data.sessionStart)
                });
                count++;
            });

            callback(onlineUsers);
        }, (error) => {
            console.error('❌ Erro ao monitorar usuários online:', error);
            callback([]);
        });

        this.listeners.set(listenerId, unsubscribe);
        return () => {
            this.listeners.delete(listenerId);
            unsubscribe();
        };
    }

    // Monitorar um usuário específico com cache
    isUserOnline(userId, callback) {
        const listenerId = `userOnline_${userId}`;
        const userPresenceRef = doc(firestore, 'presence', userId);

        const unsubscribe = onSnapshot(userPresenceRef, (doc) => {
            const exists = doc.exists();
            const data = exists ? doc.data() : null;
            const isOnline = exists && data?.isOnline === true;

            callback(isOnline, data);
        }, (error) => {
            console.error(`❌ Erro ao monitorar usuário ${userId}:`, error);
            callback(false, null);
        });

        this.listeners.set(listenerId, unsubscribe);
        return () => {
            this.listeners.delete(listenerId);
            unsubscribe();
        };
    }

    // Estatísticas de presença com cache
    async getPresenceStats() {
        try {
            const presenceQuery = query(
                collection(firestore, 'presence'),
                where('isOnline', '==', true)
            );

            const snapshot = await getDocs(presenceQuery);
            const onlineCount = snapshot.size;

            let totalSessionTime = 0;
            let activeUsers = 0;
            let idleUsers = 0;
            let awayUsers = 0;

            const now = Date.now();

            snapshot.forEach(doc => {
                const data = doc.data();

                // Calcular tempo de sessão
                if (data.sessionStart && data.sessionStart.toMillis) {
                    totalSessionTime += now - data.sessionStart.toMillis();
                }

                // Contar por status
                switch (data.status) {
                    case 'active': activeUsers++; break;
                    case 'idle': idleUsers++; break;
                    case 'away': awayUsers++; break;
                    default: activeUsers++; break;
                }
            });

            const avgSessionTime = onlineCount > 0 ? totalSessionTime / onlineCount : 0;

            return {
                onlineCount,
                activeUsers,
                idleUsers,
                awayUsers,
                avgSessionTime: Math.round(avgSessionTime / 1000 / 60), // minutos
                timestamp: new Date(),
                cacheDuration: 30000 // Cache por 30 segundos
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {
                onlineCount: 0,
                activeUsers: 0,
                idleUsers: 0,
                awayUsers: 0,
                avgSessionTime: 0,
                timestamp: new Date(),
                error: error.message
            };
        }
    }

    // ====================================================
    // UTILITÁRIOS
    // ====================================================

    getUserAgent() {
        if (typeof navigator === 'undefined') return 'Unknown';
        return navigator.userAgent.substring(0, 200); // Limitar tamanho
    }

    getPlatform() {
        if (typeof navigator === 'undefined') return 'Unknown';
        return navigator.platform || 'Unknown';
    }

    getConnectionType() {
        if (typeof navigator === 'undefined' || !navigator.connection) return 'Unknown';
        return navigator.connection.effectiveType || 'Unknown';
    }

    getConnectionQuality() {
        if (typeof navigator === 'undefined' || !navigator.connection) return 'Unknown';
        const connection = navigator.connection;

        if (connection.downlink > 10) return 'Excellent';
        if (connection.downlink > 5) return 'Good';
        if (connection.downlink > 1) return 'Fair';
        return 'Poor';
    }

    calculateSessionDuration(sessionStart) {
        if (!sessionStart) return 0;

        const start = sessionStart.toDate ? sessionStart.toDate() : new Date(sessionStart);
        return Math.floor((Date.now() - start.getTime()) / 1000 / 60); // minutos
    }

    async handlePresenceError(error) {
        console.error('❌ Erro de presença:', error);

        // Implementar retry logic ou fallback
        if (error.code === 'permission-denied') {
            console.error('❌ Permissões insuficientes para presença');
        } else if (error.code === 'unavailable') {
            console.warn('⚠️ Firestore indisponível, tentando novamente...');
            // Implementar retry
        }
    }

    // Cleanup final
    destroy() {
        this.stopPresence();
        this.cleanupListeners();

        // Remover event listeners globais
        ['online', 'offline'].forEach(event => {
            window.removeEventListener(event, this[`handle${event.charAt(0).toUpperCase() + event.slice(1)}`]);
        });

        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        ['focus', 'blur'].forEach(event => {
            window.removeEventListener(event, this[`handleWindow${event.charAt(0).toUpperCase() + event.slice(1)}`]);
        });
    }
}

// export default new OptimizedPresenceService();
*/