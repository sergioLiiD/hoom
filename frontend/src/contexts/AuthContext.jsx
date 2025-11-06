import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función para obtener el usuario actual
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        setUser(user);

        // Obtener el perfil y rol del usuario
        if (user) {
          // Primero, intentamos obtener el perfil del usuario
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('role_id, full_name')
            .eq('id', user.id)
            .single();

          console.log('AuthContext - User profile data:', { profileData, profileError: profileError?.message });

          if (!profileError && profileData) {
            // Si tenemos el perfil, obtenemos el nombre del rol
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('name')
              .eq('id', profileData.role_id)
              .single();

            console.log('AuthContext - User role data:', { roleData, roleError: roleError?.message });

            setUserRole({
              id: profileData.role_id,
              name: roleData?.name || 'user',
              fullName: profileData.full_name || user.email
            });

            console.log('AuthContext - Setting user role:', { 
              id: profileData.role_id, 
              name: roleData?.name || 'user',
              isOwner: roleData?.name === 'owner'
            });
          } else {
            setUserRole({ id: 3, name: 'user', fullName: user.email });
          }
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          // Obtener el perfil y rol del usuario
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('role_id, full_name')
            .eq('id', session.user.id)
            .single();

          console.log('AuthContext (onAuthStateChange) - User profile data:', { profileData, profileError: profileError?.message });

          if (!profileError && profileData) {
            // Si tenemos el perfil, obtenemos el nombre del rol
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('name')
              .eq('id', profileData.role_id)
              .single();

            console.log('AuthContext (onAuthStateChange) - User role data:', { roleData, roleError: roleError?.message });

            setUserRole({
              id: profileData.role_id,
              name: roleData?.name || 'user',
              fullName: profileData.full_name || session.user.email
            });

            console.log('AuthContext (onAuthStateChange) - Setting user role:', { 
              id: profileData.role_id, 
              name: roleData?.name || 'user',
              isOwner: roleData?.name === 'owner'
            });
          } else {
            setUserRole({ id: 3, name: 'user', fullName: session.user.email });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
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

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    if (!userRole) return false;
    
    // Si el usuario es owner, tiene todos los permisos
    if (userRole.name === 'owner') return true;
    
    // Si el usuario es admin y el rol requerido es admin o user
    if (userRole.name === 'admin' && (role === 'admin' || role === 'user')) return true;
    
    // Si el rol del usuario coincide con el rol requerido
    return userRole.name === role;
  };

  // Determinar los roles basados en userRole.name
  const isOwnerRole = userRole?.name?.toLowerCase() === 'owner';
  const isAdminRole = userRole?.name?.toLowerCase() === 'admin' || isOwnerRole;
  
  console.log('AuthContext - Roles:', { 
    userRole, 
    isOwnerRole, 
    isAdminRole,
    roleName: userRole?.name,
    roleId: userRole?.id
  });
  
  const value = {
    user,
    userRole,
    loading,
    signOut,
    hasRole,
    isOwner: isOwnerRole,
    isAdmin: isAdminRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
