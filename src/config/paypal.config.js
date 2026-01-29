
const paypal = require("@paypal/checkout-server-sdk");

/**
 * Configura el entorno de PayPal (Sandbox o Live)
 * según la variable PAYPAL_MODE definida en el .env
 */

function environment() {
  // Tomamos las credenciales actuales del .env
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Si el modo es 'live', usamos el entorno real
  if (process.env.PAYPAL_MODE === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  
  // Por defecto (o si es 'sandbox'), usamos el entorno de pruebas
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

/**
 * Cliente HTTP para ejecutar peticiones a la API de PayPal
 */
const paypalClient = new paypal.core.PayPalHttpClient(environment());


module.exports = { paypalClient };