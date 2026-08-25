// src/services/cache.service.js
const NodeCache = require('node-cache');

// ✅ Crear una instancia de cache con TTL de 1 hora (3600 segundos)
const myCache = new NodeCache({
    stdTTL: 3600,        // Tiempo de vida por defecto: 1 hora
    checkperiod: 120,    // Revisar elementos caducados cada 2 minutos
    useClones: false     // Mejor rendimiento
});

class CacheService {
    /**
     * Guarda un valor en cache
     * @param {string} key - Clave única para el cache
     * @param {any} value - Valor a guardar
     * @param {number} ttl - Tiempo de vida en segundos (opcional)
     */
    set(key, value, ttl = 3600) {
        return myCache.set(key, value, ttl);
    }

    /**
     * Obtiene un valor del cache
     * @param {string} key - Clave del cache
     * @returns {any} - Valor guardado o undefined
     */
    get(key) {
        return myCache.get(key);
    }

    /**
     * Elimina un valor del cache
     * @param {string} key - Clave del cache
     */
    del(key) {
        return myCache.del(key);
    }

    /**
     * Verifica si existe una clave en cache
     * @param {string} key - Clave del cache
     * @returns {boolean}
     */
    has(key) {
        return myCache.has(key);
    }

    /**
     * Obtiene o guarda en cache con una función async
     * @param {string} key - Clave del cache
     * @param {Function} fn - Función que devuelve el valor a cachear
     * @param {number} ttl - Tiempo de vida en segundos
     * @returns {Promise<any>}
     */
    async getOrSet(key, fn, ttl = 3600) {
        // ✅ Intentar obtener del cache
        const cached = this.get(key);
        if (cached !== undefined) {
            console.log(`✅ Cache hit: ${key}`);
            return cached;
        }

        // ✅ Si no está en cache, ejecutar la función
        console.log(`❌ Cache miss: ${key}`);
        const result = await fn();
        
        // ✅ Guardar en cache
        this.set(key, result, ttl);
        return result;
    }

    /**
     * Limpia todo el cache
     */
    flush() {
        return myCache.flushAll();
    }
}

module.exports = new CacheService();