import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función simple para obtener el rol del usuario
    const getUserRole = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role_id, roles(name, is_active)')
          .eq('id', userId)
          .single();

        if (error || !data?.roles) {
          console.warn('No role found, using default user role');
          return { id: 3, name: 'user', is_active: true };
        }

        return data.roles;
      } catch (error) {
        console.error('Error getting user role:', error);
        return { id: 3, name: 'user', is_active: true };
      }
    };

    // Obtener sesión actual
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          const role = await getUserRole(session.user.id);
          setUserRole(role);
        } else {
          setUser(null);
          setUserRole(null);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    };

    // Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.id);
          setUser(session.user);
          const role = await getUserRole(session.user.id);
          setUserRole(role);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setUserRole(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed');
          setUser(session.user);
        }
      }
    );

    getInitialSession();

    return () => {
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
