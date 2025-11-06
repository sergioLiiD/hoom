import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, userRole, loading, isOwner, isActive, lastRefreshError, recoverSession } = useAuth();
  const location = useLocation();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);

  console.log('ProtectedRoute - Using AuthContext:', { 
    user: user?.id, 
    userRole, 
    loading,
    isOwner,
    isActive,
    requiredRole,
    hasRefreshError: !!lastRefreshError
  });
  
  // Intentar recuperar la sesión si hay un error de token refresh
  useEffect(() => {
    const attemptRecovery = async () => {
      if (lastRefreshError && !recoveryAttempted) {
        console.log('ProtectedRoute - Attempting to recover from token refresh error');
        setIsRecovering(true);
        setRecoveryAttempted(true);
        
        try {
          const recovered = await recoverSession();
          if (!recovered) {
            console.log('ProtectedRoute - Recovery failed, redirecting to emergency page');
            window.location.href = '/emergency?refresh_error=true';
          } else {
            console.log('ProtectedRoute - Recovery successful');
          }
        } catch (error) {
          console.error('ProtectedRoute - Error during recovery:', error);
          window.location.href = '/emergency?refresh_error=true';
        } finally {
          setIsRecovering(false);
        }
      }
    };
    
    attemptRecovery();
  }, [lastRefreshError, recoveryAttempted, recoverSession]);

  // Mostrar un loader mientras se verifica la autenticación o se recupera la sesión
  if (loading || isRecovering) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          {isRecovering ? 'Recuperando sesión...' : 'Verificando autenticación...'}
        </p>
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
