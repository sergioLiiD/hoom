import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

// Timeout para evitar carga infinita (10 segundos)
const AUTH_TIMEOUT = 10000;
// Timeout para obtener el rol (5 segundos)
const ROLE_TIMEOUT = 5000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Función con timeout para obtener el rol del usuario
    const getUserRole = async (userId) => {
      try {
        // Crear una promesa con timeout
        const rolePromise = (async () => {
          // Primero obtener el role_id del perfil
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('role_id')
            .eq('id', userId)
            .single();

          if (profileError || !profileData) {
            console.warn('No profile found, using default user role');
            return { id: 3, name: 'user', is_active: true };
          }

          // Luego obtener el rol usando el role_id
          const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('id, name, is_active')
            .eq('id', profileData.role_id)
            .single();

          if (roleError || !roleData) {
            console.warn('No role found, using default user role');
            return { id: 3, name: 'user', is_active: true };
          }

          return roleData;
        })();

        // Aplicar timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout getting user role')), ROLE_TIMEOUT);
        });

        return await Promise.race([rolePromise, timeoutPromise]);
      } catch (error) {
        console.error('Error getting user role:', error);
        // Retornar rol por defecto en caso de error
        return { id: 3, name: 'user', is_active: true };
      }
    };

    // Limpiar sesiones expiradas del storage
    const cleanupExpiredSessions = () => {
      try {
        const storageKey = 'supabase.auth.token';
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Verificar si la sesión expiró
            if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) {
              console.log('[AuthContext] Removing expired session from storage');
              window.localStorage.removeItem(storageKey);
            }
          } catch (e) {
            // Si no se puede parsear, puede estar corrupto, limpiarlo
            console.warn('[AuthContext] Corrupted session data, cleaning up');
            window.localStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error cleaning expired sessions:', error);
      }
    };

    // Obtener sesión actual con timeout
    const getInitialSession = async () => {
      try {
        console.log('[AuthContext] Getting initial session...');
        
        // Limpiar sesiones expiradas primero
        cleanupExpiredSessions();
        
        // Establecer timeout para evitar carga infinita
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            console.warn('[AuthContext] Timeout getting session, setting loading to false');
            setUser(null);
            setUserRole(null);
            setLoading(false);
          }
        }, AUTH_TIMEOUT);

        const { data: { session }, error } = await supabase.auth.getSession();

        // Limpiar timeout si la operación completó
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          if (isMountedRef.current) {
            setUser(null);
            setUserRole(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          console.log('[AuthContext] Session found, user:', session.user.id);
          if (isMountedRef.current) {
            setUser(session.user);
            // Obtener rol de forma asíncrona pero no bloquear el loading
            getUserRole(session.user.id)
              .then(role => {
                if (isMountedRef.current) {
                  setUserRole(role);
                }
              })
              .catch(err => {
                console.error('[AuthContext] Error getting role:', err);
                if (isMountedRef.current) {
                  setUserRole({ id: 3, name: 'user', is_active: true });
                }
              });
            setLoading(false);
          }
        } else {
          console.log('[AuthContext] No session found');
          if (isMountedRef.current) {
            setUser(null);
            setUserRole(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error in getInitialSession:', error);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (isMountedRef.current) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    };

    // Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, session?.user?.id);

        // Asegurarse de que loading se establezca en false para todos los eventos
        if (isMountedRef.current) {
          setLoading(false);
        }

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] User signed in:', session.user.id);
          if (isMountedRef.current) {
            setUser(session.user);
            getUserRole(session.user.id)
              .then(role => {
                if (isMountedRef.current) {
                  setUserRole(role);
                }
              })
              .catch(err => {
                console.error('[AuthContext] Error getting role on sign in:', err);
                if (isMountedRef.current) {
                  setUserRole({ id: 3, name: 'user', is_active: true });
                }
              });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out');
          if (isMountedRef.current) {
            setUser(null);
            setUserRole(null);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('[AuthContext] Token refreshed');
          if (isMountedRef.current) {
            setUser(session.user);
            // No necesitamos actualizar el rol en refresh, ya debería estar cargado
          }
        } else if (event === 'INITIAL_SESSION') {
          console.log('[AuthContext] Initial session event');
          // Este evento se dispara cuando se restaura una sesión
          if (session?.user && isMountedRef.current) {
            setUser(session.user);
            getUserRole(session.user.id)
              .then(role => {
                if (isMountedRef.current) {
                  setUserRole(role);
                }
              })
              .catch(err => {
                console.error('[AuthContext] Error getting role on initial session:', err);
                if (isMountedRef.current) {
                  setUserRole({ id: 3, name: 'user', is_active: true });
                }
              });
          } else if (!session && isMountedRef.current) {
            setUser(null);
            setUserRole(null);
          }
          if (isMountedRef.current) {
            setLoading(false);
          }
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('[AuthContext] User updated');
          if (isMountedRef.current) {
            setUser(session.user);
          }
        }
      }
    );

    getInitialSession();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setUser(null);
      setUserRole(null);
    }
  };

  const isOwner = () => userRole?.name === 'owner' || userRole?.id === 1;
  const isAdmin = () => userRole?.name === 'admin' || userRole?.id === 2;
  const isActive = () => userRole?.is_active !== false;
  const hasAdminPermissions = () => isOwner() || isAdmin();

  const value = {
    user,
    userRole,
    loading,
    signOut,
    isOwner: isOwner(),
    isAdmin: isAdmin(),
    isActive: isActive(),
    hasAdminPermissions: hasAdminPermissions(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
