import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { APP_URL, getAppUrl } from '@/config/appConfig';
import { supabase } from '@/lib/supabaseClient';
import logo from '@/assets/logo-hoom.png';

export default function SystemInfo() {
  const [systemInfo, setSystemInfo] = useState({
    appUrl: APP_URL,
    windowLocationOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
    windowLocationHref: typeof window !== 'undefined' ? window.location.href : 'N/A',
    environment: import.meta.env.MODE || 'unknown',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'N/A',
    buildTime: new Date().toISOString(),
  });
  
  const [supabaseInfo, setSupabaseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        setLoading(true);
        
        // Verificar la conexión con Supabase
        const { data, error } = await supabase.from('user_roles').select('*').limit(1);
        
        if (error) throw error;
        
        // Obtener información de la sesión actual
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        setSupabaseInfo({
          connected: true,
          session: sessionData?.session ? {
            user: {
              id: sessionData.session.user.id,
              email: sessionData.session.user.email,
            },
            expires_at: new Date(sessionData.session.expires_at * 1000).toISOString(),
          } : null,
          roles: data || []
        });
      } catch (err) {
        console.error('Error al verificar Supabase:', err);
        setError(`Error al verificar Supabase: ${err.message}`);
        setSupabaseInfo({
          connected: false,
          error: err.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkSupabase();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <img src={logo} alt="Hoom Logo" className="h-12 mb-4" />
          <CardTitle className="text-2xl font-bold">Información del Sistema</CardTitle>
          <CardDescription>
            Detalles técnicos de la aplicación para diagnóstico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Información de la Aplicación</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Entorno:</p>
                    <p className="text-sm text-blue-700">{systemInfo.environment}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">URL de la Aplicación:</p>
                    <p className="text-sm text-blue-700">{systemInfo.appUrl}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-blue-800">window.location.origin:</p>
                  <p className="text-sm text-blue-700">{systemInfo.windowLocationOrigin}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-blue-800">window.location.href:</p>
                  <p className="text-sm text-blue-700">{systemInfo.windowLocationHref}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-blue-800">URL de Supabase:</p>
                  <p className="text-sm text-blue-700">{systemInfo.supabaseUrl}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-blue-800">Ejemplo de URL generada:</p>
                  <p className="text-sm text-blue-700">{getAppUrl('/register?code=ejemplo')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="font-semibold text-green-800 mb-2">Estado de Supabase</h3>
              {loading ? (
                <p className="text-sm text-green-700">Verificando conexión...</p>
              ) : supabaseInfo ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${supabaseInfo.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-sm font-medium text-green-800">
                      {supabaseInfo.connected ? 'Conectado' : 'Desconectado'}
                    </p>
                  </div>
                  
                  {supabaseInfo.session && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-green-800">Sesión activa:</p>
                      <div className="bg-white p-2 rounded-md mt-1">
                        <p className="text-xs">Usuario: {supabaseInfo.session.user.email}</p>
                        <p className="text-xs">ID: {supabaseInfo.session.user.id}</p>
                        <p className="text-xs">Expira: {new Date(supabaseInfo.session.expires_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {supabaseInfo.roles && supabaseInfo.roles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-green-800">Roles disponibles:</p>
                      <div className="bg-white p-2 rounded-md mt-1">
                        <ul className="text-xs space-y-1">
                          {supabaseInfo.roles.map(role => (
                            <li key={role.id}>{role.id}: {role.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-700">No se pudo obtener información de Supabase</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground text-center">
            Esta página es solo para diagnóstico técnico.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
