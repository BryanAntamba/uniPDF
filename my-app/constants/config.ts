import Constants from 'expo-constants';

/**
 * Configuración de la API del backend
 * 
 * Prioridad:
 * 1. Variable de entorno EXPO_PUBLIC_API_URL
 * 2. Configuración en app.json (extra.apiUrl)
 * 3. Fallback a localhost
 */
export const API_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.apiUrl || 
  'http://localhost:3000';

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
