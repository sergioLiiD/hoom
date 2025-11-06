import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Función para limpiar las cookies de Supabase
  const clearSupabaseCookies = () => {
    // Obtener todos los nombres de cookies
    const cookies = document.cookie.split(';');
    
    // Eliminar cada cookie
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      
      // Eliminar la cookie estableciendo una fecha de expiración en el pasado
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      
      console.log(`Cookie eliminada: ${name}`);
    }
    
    // Limpiar localStorage
    localStorage.clear();
    console.log('localStorage limpiado');
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    console.log('sessionStorage limpiado');
  };

  // Función para cerrar sesión de forma forzada
  const forceLogout = async () => {
    try {
      setLoading(true);
      
      // Cerrar sesión en Supabase
      await supabase.auth.signOut({ scope: 'global' });
      console.log('Sesión cerrada en Supabase');
      
      // Limpiar cookies y almacenamiento local
      clearSupabaseCookies();
      
      setSuccess(true);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    forceLogout();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Cerrando sesión</h1>
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Cerrando sesión y limpiando datos...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
            <p className="font-semibold">Error al cerrar sesión:</p>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4">
            <p className="font-semibold">Sesión cerrada correctamente</p>
            <p>Se han eliminado todas las cookies y datos de sesión.</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-2 mt-4">
          <Button 
            onClick={() => window.location.href = '/login'} 
            disabled={loading}
            className="w-full"
          >
            Ir a la página de inicio de sesión
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            disabled={loading}
            className="w-full"
          >
            Recargar la página
          </Button>
        </div>
      </div>
    </div>
  );
}
