

const axios = require('axios');

/**
 * Función para mantener el backend de Render despierto.
 * Se auto-llama cada 14 minutos.
 */
const setupAutoPing = () => {
  const URL = 'https://expedinap-2-0-backend.onrender.com/keep-alive';
  const INTERVAL = 14 * 60 * 1000; // 14 minutos

  console.log('[Auto-Ping] Sistema de persistencia inicializado.');

  setInterval(async () => {
    try {
      const response = await axios.get(URL);
      console.log(`[Auto-Ping] Ping exitoso: ${response.data} (${new Date().toLocaleTimeString()})`);
    } catch (error) {
      console.error('[Auto-Ping] Fallo en el auto-ping:', error.message);
    }
  }, INTERVAL);
};

module.exports = setupAutoPing;