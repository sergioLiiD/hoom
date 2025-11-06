/**
 * Configuración global de la aplicación
 */

// URLs de la aplicación según el entorno
const APP_URLS = {
  development: 'http://localhost:5173',
  production: 'https://market.hoom.cloud'
};

// Determinar el entorno actual
const ENV = import.meta.env.MODE || 'development';

// URL base de la aplicación
export const APP_URL = APP_URLS[ENV] || APP_URLS.development;

// Función para generar URLs absolutas
export const getAppUrl = (path = '') => {
  const basePath = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
};

// Otras configuraciones de la aplicación
export default {
  appName: 'Hoom Properties',
  appUrl: APP_URL,
  getAppUrl,
  // Añadir otras configuraciones según sea necesario
};
