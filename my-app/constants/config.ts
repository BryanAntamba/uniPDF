import Constants from 'expo-constants';

/**
 * Configuración de la API del backend
 * 
 * Prioridad:
 * 1. Variable de entorno EXPO_PUBLIC_API_URL (manual en archivo .env)
 * 2. Autodetectar IP local de Metro Bundler en desarrollo (para pruebas en móvil físico sin configurar nada)
 * 3. Configuración en app.json (extra.apiUrl)
 * 4. Fallback por defecto a localhost
 */
export const API_URL = (() => {
  // 1. Variable de entorno EXPO_PUBLIC_API_URL (manual en .env)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Intentar detectar automáticamente la IP del host de Metro Bundler en desarrollo
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    // Evitar usar localhost si estamos en desarrollo móvil real, ya que localhost no apunta a la PC desde el celular
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }

  // 3. Configuración en app.json (extra.apiUrl)
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // 4. Fallback por defecto a localhost
  return 'http://localhost:3000';
})();

/**
 * Obtiene la URL base del backend sin el puerto
 */
export const getBackendHost = (): string => {
  // Extraer host de la URL completa
  try {
    const url = new URL(API_URL);
    return url.hostname;
  } catch {
    // Si falla el parsing, retornar localhost
    return 'localhost';
  }
};

/**
 * Obtiene la URL completa del backend
 */
export const getBackendURL = (): string => {
  return API_URL;
};

/**
 * Construye una URL completa para un endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};
