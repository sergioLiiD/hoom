import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

// Crear un storage wrapper que maneje errores
const safeStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('[Supabase] Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error('[Supabase] Error writing to localStorage:', error);
      // Si el storage está lleno, intentar limpiar tokens viejos
      try {
        const keys = Object.keys(window.localStorage);
        keys.forEach(k => {
          if (k.startsWith('supabase.auth.token')) {
            window.localStorage.removeItem(k);
          }
        });
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.error('[Supabase] Could not clear old tokens:', e);
      }
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('[Supabase] Error removing from localStorage:', error);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage,
    storageKey: 'supabase.auth.token',
    // Aumentar el tiempo de refresh para evitar problemas
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'hoom-properties-search'
    }
  }
})

// Interceptar errores de red para mejor debugging
const originalFetch = supabase.rest.fetch;
supabase.rest.fetch = async (url, options) => {
  try {
    const response = await originalFetch(url, options);
    return response;
  } catch (error) {
    console.error('[Supabase] Network error:', {
      url,
      method: options?.method,
      error: error.message
    });
    throw error;
  }
};
