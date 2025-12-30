import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, userRole, loading, isOwner, isActive } = useAuth();
  const location = useLocation();
  const [timeoutReached, setTimeoutReached] = useState(false);

  console.log('ProtectedRoute - Using AuthContext:', { 
    user: user?.id, 
    userRole, 
    loading,
    isOwner,
    isActive,
    requiredRole
  });

  // Timeout de seguridad: si lleva más de 15 segundos cargando, mostrar opción de salir
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('[ProtectedRoute] Loading timeout reached');
        setTimeoutReached(true);
      }, 15000);

      return () => clearTimeout(timeout);
    } else {
      setTimeoutReached(false);
    }
  }, [loading]);
  
  // Mostrar loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Verificando autenticación...
        </p>
        {timeoutReached && (
          <div className="mt-6 p-4 border border-yellow-300 rounded-lg bg-yellow-50 max-w-md">
            <p className="text-sm text-yellow-800 mb-2">
              La verificación está tardando más de lo esperado.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  // Limpiar sesión y redirigir a login
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
              >
                Ir a Login
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Recargar la página
                  window.location.reload();
                }}
              >
                Recargar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Redirigir a login si no hay usuario autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Verificar si el usuario está activo
  if (!isActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Cuenta desactivada</h1>
        <p className="mb-4">Tu cuenta ha sido desactivada por un administrador.</p>
        <p className="mb-6">Por favor, contacta con el administrador si crees que esto es un error.</p>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/force-logout'}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  // Verificar si el usuario tiene el rol requerido
  if (requiredRole === 'owner' && !isOwner) {
    console.log('ProtectedRoute - Access denied (owner check):', { 
      requiredRole, 
      isOwner,
      userRole: userRole?.name,
      user: user?.id
    });
    
    // Si se requiere ser owner y el usuario no lo es, mostrar acceso denegado
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Acceso denegado</h1>
        <p className="mb-4">No tienes los permisos necesarios para acceder a esta página.</p>
        <p className="text-muted-foreground mb-4">
          Rol requerido: <span className="font-semibold">Owner</span>
        </p>
        <p className="text-muted-foreground mb-4">
          Tu rol actual: <span className="font-semibold">{userRole?.name || 'No definido'}</span>
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
