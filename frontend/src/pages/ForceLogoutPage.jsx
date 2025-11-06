import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogOut, RefreshCw, Trash2 } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';

export default function ForceLogoutPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Esperando acción...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Verificar si hay una sesión activa al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setStatus(`Sesión activa detectada para: ${data.session.user.email}`);
        } else {
          setStatus('No hay sesión activa');
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        setError('Error al verificar la sesión');
      }
    };

    checkSession();
  }, []);

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('Cerrando sesión...');

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setStatus('Sesión cerrada correctamente');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError(`Error al cerrar sesión: ${err.message}`);
      setStatus('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar el almacenamiento local
  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setStatus('Almacenamiento local limpiado correctamente');
    } catch (err) {
      console.error('Error al limpiar almacenamiento:', err);
      setError(`Error al limpiar almacenamiento: ${err.message}`);
    }
  };

  // Función para forzar cierre de sesión (limpia almacenamiento y cierra sesión)
  const handleForceLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('Forzando cierre de sesión...');

      // Primero limpiar almacenamiento local
      localStorage.clear();
      sessionStorage.clear();

      // Luego cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setStatus('Sesión forzada cerrada correctamente');
      setTimeout(() => {
        // Redirigir a login después de un breve retraso
        window.location.href = '/login'; // Usamos window.location para forzar recarga completa
      }, 2000);
    } catch (err) {
      console.error('Error al forzar cierre de sesión:', err);
      setError(`Error al forzar cierre de sesión: ${err.message}`);
      setStatus('Error al forzar cierre de sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <img src={logo} alt="Hoom Logo" className="h-12 mb-4" />
          <CardTitle className="text-2xl font-bold">Gestión de Sesión</CardTitle>
          <CardDescription>
            Herramientas para solucionar problemas de sesión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Estado actual: <span className="font-medium">{status}</span>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <Button 
              onClick={handleSignOut} 
              disabled={loading}
              className="flex items-center"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Cerrar Sesión Normal
            </Button>
            
            <Button 
              onClick={clearLocalStorage}
              variant="outline"
              className="flex items-center"
              disabled={loading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar Almacenamiento Local
            </Button>
            
            <Button 
              onClick={handleForceLogout}
              variant="destructive"
              className="flex items-center"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Forzar Cierre de Sesión
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground text-center">
            Esta página te ayuda a solucionar problemas con la sesión de usuario.
            Si tienes problemas para acceder, usa la opción "Forzar Cierre de Sesión".
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
