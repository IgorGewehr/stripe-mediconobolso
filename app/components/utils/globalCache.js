// ✅ SISTEMA DE CACHE GLOBAL OTIMIZADO E COORDENADO
class GlobalCacheManager {
    constructor() {
        this.caches = new Map();
        this.cleanupIntervals = new Map();
        this.maxCacheSize = 1000; // Máximo de entradas por cache
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos padrão

        // Configurações específicas por tipo de cache
        this.cacheConfigs = {
            userContext: { ttl: 10 * 60 * 1000, maxSize: 100 },  // 10 min, 100 usuários
            verification: { ttl: 30 * 1000, maxSize: 500 },       // 30 seg, 500 verificações
            permissions: { ttl: 5 * 60 * 1000, maxSize: 200 },    // 5 min, 200 permissões
            userData: { ttl: 15 * 60 * 1000, maxSize: 100 },      // 15 min, 100 usuários
            moduleAccess: { ttl: 2 * 60 * 1000, maxSize: 300 }    // 2 min, 300 acessos
        };

        this.setupGlobalCleanup();
        this.setupMemoryMonitoring();
    }

    // ✅ CRIAR OU OBTER CACHE
    getCache(name) {
        if (!this.caches.has(name)) {
            const config = this.cacheConfigs[name] || {
                ttl: this.defaultTTL,
                maxSize: this.maxCacheSize
            };

            this.caches.set(name, {
                data: new Map(),
                config,
                hits: 0,
                misses: 0,
                created: Date.now()
            });

            this.setupCacheCleanup(name);
        }

        return this.caches.get(name);
    }

    // ✅ ARMAZENAR NO CACHE COM TTL
    set(cacheName, key, value, customTTL = null) {
        const cache = this.getCache(cacheName);
        const ttl = customTTL || cache.config.ttl;

        // Verificar se cache está cheio
        if (cache.data.size >= cache.config.maxSize) {
            this.evictOldestEntries(cacheName, Math.floor(cache.config.maxSize * 0.1));
        }

        const entry = {
            value,
            timestamp: Date.now(),
            expires: Date.now() + ttl,
            hits: 0
        };

        cache.data.set(key, entry);

        // Log para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.log(`📦 Cache SET [${cacheName}]: ${key} (TTL: ${ttl}ms)`);
        }

        return value;
    }

    // ✅ OBTER DO CACHE
    get(cacheName, key) {
        const cache = this.getCache(cacheName);
        const entry = cache.data.get(key);

        if (!entry) {
            cache.misses++;
            return null;
        }

        // Verificar se expirou
        if (Date.now() > entry.expires) {
            cache.data.delete(key);
            cache.misses++;
            return null;
        }

        // Incrementar contadores
        entry.hits++;
        cache.hits++;

        // Log para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.log(`📦 Cache HIT [${cacheName}]: ${key} (hits: ${entry.hits})`);
        }

        return entry.value;
    }

    // ✅ OBTER OU COMPUTAR (GET OR SET)
    async getOrSet(cacheName, key, computeFn, customTTL = null) {
        const cached = this.get(cacheName, key);
        if (cached !== null) {
            return cached;
        }

        try {
            const value = await computeFn();
            return this.set(cacheName, key, value, customTTL);
        } catch (error) {
            console.error(`❌ Erro ao computar valor para cache [${cacheName}:${key}]:`, error);
            throw error;
        }
    }

    // ✅ INVALIDAR CACHE ESPECÍFICO
    invalidate(cacheName, key = null) {
        const cache = this.getCache(cacheName);

        if (key) {
            cache.data.delete(key);
            console.log(`🗑️ Cache invalidated [${cacheName}]: ${key}`);
        } else {
            cache.data.clear();
            console.log(`🗑️ Cache cleared [${cacheName}]: all entries`);
        }
    }

    // ✅ LIMPAR ENTRADAS ANTIGAS
    evictOldestEntries(cacheName, count) {
        const cache = this.getCache(cacheName);
        const entries = Array.from(cache.data.entries());

        // Ordenar por timestamp (mais antigos primeiro)
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Remover as mais antigas
        for (let i = 0; i < Math.min(count, entries.length); i++) {
            cache.data.delete(entries[i][0]);
        }

        console.log(`🧹 Evicted ${count} old entries from [${cacheName}]`);
    }

    // ✅ CONFIGURAR LIMPEZA AUTOMÁTICA POR CACHE
    setupCacheCleanup(cacheName) {
        if (this.cleanupIntervals.has(cacheName)) {
            return;
        }

        const cache = this.getCache(cacheName);
        const cleanupInterval = Math.min(cache.config.ttl, 60000); // Max 1 minuto

        const intervalId = setInterval(() => {
            this.cleanupExpiredEntries(cacheName);
        }, cleanupInterval);

        this.cleanupIntervals.set(cacheName, intervalId);
    }

    // ✅ LIMPAR ENTRADAS EXPIRADAS
    cleanupExpiredEntries(cacheName) {
        const cache = this.getCache(cacheName);
        const now = Date.now();
        let expiredCount = 0;

        for (const [key, entry] of cache.data.entries()) {
            if (now > entry.expires) {
                cache.data.delete(key);
                expiredCount++;
            }
        }

        if (expiredCount > 0) {
            console.log(`🧹 Cleaned ${expiredCount} expired entries from [${cacheName}]`);
        }
    }

    // ✅ LIMPEZA GLOBAL PERIÓDICA
    setupGlobalCleanup() {
        setInterval(() => {
            this.performGlobalCleanup();
        }, 5 * 60 * 1000); // A cada 5 minutos
    }

    performGlobalCleanup() {
        console.log('🧹 Performing global cache cleanup...');

        for (const [cacheName] of this.caches) {
            this.cleanupExpiredEntries(cacheName);

            // Se cache está muito cheio, fazer eviction agressiva
            const cache = this.getCache(cacheName);
            if (cache.data.size > cache.config.maxSize * 0.8) {
                this.evictOldestEntries(cacheName, Math.floor(cache.config.maxSize * 0.2));
            }
        }
    }

    // ✅ MONITORAMENTO DE MEMÓRIA
    setupMemoryMonitoring() {
        if (typeof window !== 'undefined' && 'memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

                // Se usando mais de 80% da memória, fazer limpeza agressiva
                if (usedMB > limitMB * 0.8) {
                    console.warn(`⚠️ High memory usage: ${usedMB}MB/${limitMB}MB`);
                    this.performAggressiveCleanup();
                }
            }, 30000); // A cada 30 segundos
        }
    }

    // ✅ LIMPEZA AGRESSIVA EM CASO DE MEMÓRIA BAIXA
    performAggressiveCleanup() {
        console.log('🚨 Performing aggressive cleanup due to memory pressure...');

        for (const [cacheName] of this.caches) {
            const cache = this.getCache(cacheName);

            // Reduzir cache para 50% do tamanho máximo
            const targetSize = Math.floor(cache.config.maxSize * 0.5);
            const currentSize = cache.data.size;

            if (currentSize > targetSize) {
                this.evictOldestEntries(cacheName, currentSize - targetSize);
            }
        }
    }

    // ✅ OBTER ESTATÍSTICAS DE CACHE
    getStats(cacheName = null) {
        if (cacheName) {
            const cache = this.getCache(cacheName);
            return {
                name: cacheName,
                size: cache.data.size,
                maxSize: cache.config.maxSize,
                hits: cache.hits,
                misses: cache.misses,
                hitRate: cache.hits + cache.misses > 0 ?
                    (cache.hits / (cache.hits + cache.misses) * 100).toFixed(2) + '%' : '0%',
                created: cache.created,
                ttl: cache.config.ttl
            };
        }

        // Estatísticas globais
        const allStats = {};
        let totalHits = 0;
        let totalMisses = 0;
        let totalSize = 0;

        for (const [name] of this.caches) {
            const stats = this.getStats(name);
            allStats[name] = stats;
            totalHits += stats.hits;
            totalMisses += stats.misses;
            totalSize += stats.size;
        }

        return {
            caches: allStats,
            global: {
                totalSize,
                totalHits,
                totalMisses,
                globalHitRate: totalHits + totalMisses > 0 ?
                    (totalHits / (totalHits + totalMisses) * 100).toFixed(2) + '%' : '0%'
            }
        };
    }

    // ✅ DESTRUIR TODOS OS CACHES (CLEANUP)
    destroy() {
        console.log('🗑️ Destroying global cache manager...');

        // Limpar intervalos
        for (const intervalId of this.cleanupIntervals.values()) {
            clearInterval(intervalId);
        }

        // Limpar caches
        this.caches.clear();
        this.cleanupIntervals.clear();
    }
}

// ✅ INSTÂNCIA GLOBAL DO CACHE MANAGER
const globalCache = new GlobalCacheManager();

// ✅ HOOK PARA USAR CACHE EM COMPONENTES REACT
export const useCache = (cacheName = 'default') => {
    const set = useCallback((key, value, ttl) => {
        return globalCache.set(cacheName, key, value, ttl);
    }, [cacheName]);

    const get = useCallback((key) => {
        return globalCache.get(cacheName, key);
    }, [cacheName]);

    const getOrSet = useCallback(async (key, computeFn, ttl) => {
        return globalCache.getOrSet(cacheName, key, computeFn, ttl);
    }, [cacheName]);

    const invalidate = useCallback((key) => {
        globalCache.invalidate(cacheName, key);
    }, [cacheName]);

    const clear = useCallback(() => {
        globalCache.invalidate(cacheName);
    }, [cacheName]);

    const getStats = useCallback(() => {
        return globalCache.getStats(cacheName);
    }, [cacheName]);

    return { set, get, getOrSet, invalidate, clear, getStats };
};

// ✅ HOOK PARA CACHE COM INVALIDAÇÃO AUTOMÁTICA
export const useCacheWithInvalidation = (cacheName, dependencies = []) => {
    const cache = useCache(cacheName);

    useEffect(() => {
        // Invalidar cache quando dependências mudarem
        cache.clear();
    }, dependencies);

    useEffect(() => {
        // Cleanup ao desmontar
        return () => {
            cache.clear();
        };
    }, []);

    return cache;
};

// ✅ HOOK PARA MONITORAR PERFORMANCE DE CACHE
export const useCacheStats = () => {
    const [stats, setStats] = useState(null);

    const refreshStats = useCallback(() => {
        const currentStats = globalCache.getStats();
        setStats(currentStats);
    }, []);

    useEffect(() => {
        refreshStats();

        // Atualizar stats a cada 10 segundos em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            const interval = setInterval(refreshStats, 10000);
            return () => clearInterval(interval);
        }
    }, [refreshStats]);

    return { stats, refreshStats };
};

// ✅ COMPONENTE PARA DEBUG DE CACHE (APENAS DESENVOLVIMENTO)
export const CacheDebugPanel = () => {
    const { stats, refreshStats } = useCacheStats();

    if (process.env.NODE_ENV !== 'development' || !stats) {
        return null;
    }

    return (
        <Box sx={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            bgcolor: 'rgba(0,0,0,0.8)',
            color: 'white',
            p: 2,
            borderRadius: 2,
            fontSize: '12px',
            maxWidth: 300,
            zIndex: 9999
        }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Cache Stats
            </Typography>

            <Typography variant="caption" display="block">
                Global Hit Rate: {stats.global.globalHitRate}
            </Typography>

            <Typography variant="caption" display="block">
                Total Entries: {stats.global.totalSize}
            </Typography>

            {Object.entries(stats.caches).map(([name, cacheStats]) => (
                <Box key={name} sx={{ mt: 1, pl: 1, borderLeft: '2px solid #fff' }}>
                    <Typography variant="caption" display="block">
                        <strong>{name}:</strong> {cacheStats.size}/{cacheStats.maxSize} ({cacheStats.hitRate})
                    </Typography>
                </Box>
            ))}

            <Button size="small" onClick={refreshStats} sx={{ mt: 1, color: 'white' }}>
                Refresh
            </Button>
        </Box>
    );
};

// Exportar instância global para uso direto
export default globalCache;