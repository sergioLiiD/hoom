import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('ProtectedRoute - Checking user authentication...');
        // Verificar si hay un usuario autenticado
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('ProtectedRoute - Auth response:', { user: user?.id, error: error?.message });
        
        if (error || !user) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        setUser(user);

        // Obtener el rol del usuario
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('role_id, user_roles(id, name)')
            .eq('id', user.id)
            .single();

          console.log('ProtectedRoute - User profile data:', { 
            profileData, 
            profileError: profileError?.message,
            role: profileData?.user_roles?.name,
            roleId: profileData?.role_id
          });

          if (!profileError && profileData) {
            setUserRole(profileData.user_roles?.name || null);
          }
        }
      } catch (error) {
        console.error('Error al verificar usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Mostrar un loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirigir a login si no hay usuario autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene el rol requerido
  // Temporalmente permitimos acceso a la ruta /config
  if (requiredRole && userRole !== requiredRole && location.pathname !== '/config') {
    console.log('ProtectedRoute - Access denied:', { 
      requiredRole, 
      userRole,
      user: user?.id
    });
    
    // Si se requiere un rol específico y el usuario no lo tiene, mostrar acceso denegado
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Acceso denegado</h1>
        <p className="mb-4">No tienes los permisos necesarios para acceder a esta página.</p>
        <p className="text-muted-foreground mb-4">
          Rol requerido: <span className="font-semibold">{requiredRole}</span>
        </p>
        <p className="text-muted-foreground mb-4">
          Tu rol actual: <span className="font-semibold">{userRole || 'No definido'}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Contacta al administrador si crees que esto es un error.
        </p>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido protegido
  return children;
}
