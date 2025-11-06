import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [lastRefreshError, setLastRefreshError] = useState(null);
  
  console.log('AuthProvider initialized');

  useEffect(() => {
    console.log('AuthProvider useEffect running');
    
    // Función para obtener el rol del usuario con reintentos
    const getUserRole = async (userId, retryCount = 0) => {
      try {
        console.log(`Getting role for user: ${userId} (intento ${retryCount + 1})`);
        
        // Consulta directa para obtener el rol y el nombre del rol en una sola consulta
        const { data, error } = await supabase
          .rpc('get_user_role_info', { user_id: userId });
        
        if (error) {
          console.error('Error getting user role info:', error);
          
          // Si es un error de RPC no encontrado, intentamos el fallback inmediatamente
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log('RPC function not found, using fallback immediately');
          } else if (retryCount < 2) {
            // Reintentar hasta 3 veces con un retraso exponencial
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return getUserRole(userId, retryCount + 1);
          } else {
            console.log('Max retries reached, using fallback');
          }
        } else if (data && data.role_id) {
          console.log('User role info retrieved:', data);
          return {
            id: data.role_id,
            name: data.role_name || 'user',
            fullName: data.full_name,
            is_active: data.is_active !== false // Si is_active es null o undefined, consideramos que está activo
          };
        }
        
        // Fallback a consultas separadas
        console.log('Fallback: getting user profile directly');
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('role_id, full_name')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error('Error getting user profile:', profileError);
          
          // Si el perfil no existe, intentamos crearlo con rol de usuario por defecto
          if (profileError.code === 'PGRST116') { // No se encontraron resultados
            console.log('Profile not found, attempting to create default profile');
            
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({ id: userId, role_id: 3 })
              .select()
              .single();
              
            if (createError) {
              console.error('Error creating default profile:', createError);
              return { id: 3, name: 'user' };
            }
            
            console.log('Default profile created:', newProfile);
            return { id: 3, name: 'user', fullName: '', is_active: true };
          }
          
          return { id: 3, name: 'user' };
        }
        
        if (!profileData) {
          console.error('No profile data found');
          return { id: 3, name: 'user' };
        }
        
        const roleId = profileData.role_id || 3;
        let roleName = 'user';
        
        // Obtener el nombre del rol
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('name')
          .eq('id', roleId)
          .single();
        
        if (!roleError && roleData) {
          roleName = roleData.name;
        } else if (roleError) {
          console.error('Error getting role name:', roleError);
        }
        
        return {
          id: roleId,
          name: roleName,
          fullName: profileData.full_name || '',
          is_active: profileData.is_active !== false // Si is_active es null o undefined, consideramos que está activo
        };
      } catch (error) {
        console.error('Error in getUserRole:', error);
        
        // Si hay un error inesperado y no hemos alcanzado el máximo de reintentos
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Unexpected error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return getUserRole(userId, retryCount + 1);
        }
        
        return { id: 3, name: 'user' };
      }
    };
    
    // Función para obtener el usuario actual con manejo mejorado de errores
    const getUser = async () => {
      try {
        console.log('Getting current user');
        // Primero intentamos obtener la sesión completa
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          // Intentar recuperar solo el usuario como fallback
          const { data: { user: fallbackUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !fallbackUser) {
            console.error('Error getting user after session failure:', userError);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          // Si pudimos obtener el usuario pero no la sesión
          console.log('Retrieved user without session:', fallbackUser.id);
          setUser(fallbackUser);
        } else if (!sessionData.session) {
          console.log('No active session found');
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        } else {
          // Si tenemos una sesión v��lida
          const user = sessionData.session.user;
          console.log('User found from session:', user.id);
          setUser(user);
        }
        
        // A partir de aquí, user debería estar establecido si hay un usuario autenticado
        if (!user && !sessionData?.session?.user) {
          console.log('No user found');
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        // Usar el usuario de la sesión si está disponible, o el usuario ya establecido
        const currentUser = sessionData?.session?.user || user;
        
        try {
          // Obtener el rol del usuario con reintentos
          const userId = currentUser.id;
          console.log('Getting role for user:', userId);
          const role = await getUserRole(userId);
          console.log('Setting user role:', role);
          setUserRole(role);
        } catch (roleError) {
          console.error('Error getting user role:', roleError);
          // Si falla la obtención del rol, establecer un rol por defecto
          setUserRole({ id: 3, name: 'user', is_active: true });
        }
      } catch (error) {
        console.error('Unexpected error in getUser:', error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Suscribirse a cambios en la autenticación con manejo mejorado de errores
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in:', session.user.id);
          setUser(session.user);
          
          try {
            // Obtener el rol del usuario con reintentos
            const role = await getUserRole(session.user.id);
            console.log('Setting user role after sign in:', role);
            setUserRole(role);
          } catch (roleError) {
            console.error('Error getting user role after sign in:', roleError);
            // Si falla la obtención del rol, establecer un rol por defecto
            setUserRole({ id: 3, name: 'user', is_active: true });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setUserRole(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed');
          // Verificar si el usuario y el rol están correctamente establecidos
          if (session) {
            console.log('Refreshing user role after token refresh');
            try {
              // Asegurarse de que el usuario está establecido
              setUser(session.user);
              
              // Intentar obtener el rol del usuario con manejo de errores mejorado
              const role = await getUserRole(session.user.id);
              console.log('Setting user role after token refresh:', role);
              setUserRole(role);
            } catch (roleError) {
              console.error('Error getting user role after token refresh:', roleError);
              // Si falla la obtención del rol, establecer un rol por defecto para evitar un estado inconsistente
              setUserRole(userRole || { id: 3, name: 'user', is_active: true });
              setLastRefreshError(roleError);
            }
          } else {
            console.warn('Token refreshed but no session available');
            // Intentar recuperar la sesión con el mecanismo de recuperación
            const recovered = await recoverSession();
            if (!recovered && refreshAttempts < 3) {
              console.log(`Recovery attempt ${refreshAttempts + 1} failed, trying again...`);
              // Esperar un poco antes de intentar de nuevo
              setTimeout(() => {
                getUser();
              }, 1000 * Math.pow(2, refreshAttempts)); // Backoff exponencial: 1s, 2s, 4s
            } else if (!recovered) {
              console.error('Failed to recover session after multiple attempts');
              // Redirigir al usuario a la página de emergencia después de varios intentos fallidos
              if (window.location.pathname !== '/emergency' && window.location.pathname !== '/login') {
                console.log('Redirecting to emergency page due to persistent session issues');
                window.location.href = '/emergency';
              }
            }
          }
        } else if (event === 'USER_UPDATED') {
          console.log('User updated');
          if (session) {
            setUser(session.user);
          }
        }
      }
    );
    
    // Obtener el usuario al cargar la página
    getUser();
    
    // Limpiar la suscripción al desmontar
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Función para recuperar la sesión en caso de error
  const recoverSession = async () => {
    try {
      console.log('Attempting to recover session...');
      setRefreshAttempts(prev => prev + 1);
      
      // Intentar obtener la sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error recovering session:', sessionError);
        setLastRefreshError(sessionError);
        return false;
      }
      
      if (!sessionData.session) {
        console.log('No session available for recovery');
        return false;
      }
      
      // Si tenemos una sesión, actualizar el estado
      setUser(sessionData.session.user);
      
      // Intentar obtener el rol del usuario
      try {
        const role = await getUserRole(sessionData.session.user.id);
        setUserRole(role);
        console.log('Session recovered successfully');
        return true;
      } catch (roleError) {
        console.error('Error getting role during recovery:', roleError);
        setUserRole({ id: 3, name: 'user', is_active: true });
        return true; // Consideramos que se recuperó parcialmente
      }
    } catch (error) {
      console.error('Unexpected error during session recovery:', error);
      setLastRefreshError(error);
      return false;
    }
  };
  
  // Función para cerrar sesión
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setRefreshAttempts(0);
      setLastRefreshError(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    if (!userRole) return false;
    return userRole.name === role;
  };
  
  // Verificar si el usuario está activo
  const isOwnerRole = userRole?.name === 'owner';
  const isAdminRole = userRole?.name === 'admin';
  const isActive = userRole?.is_active !== false;
  
  const value = {
    user,
    userRole,
    loading,
    signOut,
    hasRole,
    isOwner: isOwnerRole,
    isAdmin: isAdminRole,
    isActive,
    recoverSession,
    refreshAttempts,
    lastRefreshError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
