import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Trash2, LogOut, ShieldAlert } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';

export default function EmergencyAccess() {
  const [status, setStatus] = useState('Esperando acción...');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { recoverSession, refreshAttempts, lastRefreshError } = useAuth();

  // Verificar si hay un error de token refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromRefreshError = urlParams.get('refresh_error');
    
    if (fromRefreshError === 'true') {
      setStatus('Redirigido por error de actualización de token');
      setError('Se detectó un problema al actualizar la sesión. Intenta recuperar la sesión o iniciar sesión nuevamente.');
    }
  }, []);

  // Verificar si hay una sesión activa al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setStatus(`Sesión activa detectada para: ${data.session.user.email}`);
          setSessionInfo(data);
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
      setSessionInfo(null);
      clearLocalStorage();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError(`Error al cerrar sesión: ${err.message}`);
      setStatus('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar la sesión actual
  const checkCurrentSession = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error al verificar sesión:', error);
        setError(`Error al verificar sesión: ${error.message}`);
      } else {
        console.log('Sesión actual:', data);
        setSessionInfo(data);
        setStatus(data.session ? 'Sesión activa encontrada' : 'No hay sesión activa');
      }
    } catch (err) {
      console.error('Error inesperado al verificar sesión:', err);
      setError(`Error inesperado al verificar sesión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar sesión de emergencia
  const handleEmergencyLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setStatus('Iniciando sesión de emergencia...');
      
      // Primero limpiar cualquier sesión existente
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      // Intentar iniciar sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      setStatus('Sesión iniciada correctamente');
      setSessionInfo(data);
      
      // Verificar si el usuario es admin u owner
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('role_id')
          .eq('id', data.user.id)
          .single();
          
        if (!profileError && profileData && (profileData.role_id === 1 || profileData.role_id === 2)) {
          setIsAdmin(true);
        }
      } catch (profileErr) {
        console.error('Error al verificar rol:', profileErr);
      }
      
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(`Error al iniciar sesión: ${err.message}`);
      setStatus('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Función para forzar la creación de un perfil de usuario
  const createUserProfile = async () => {
    if (!sessionInfo?.session?.user?.id) {
      setError('No hay usuario autenticado');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setStatus('Creando perfil de usuario...');
      
      const userId = sessionInfo.session.user.id;
      
      // Verificar si ya existe un perfil
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (!checkError && existingProfile) {
        setStatus('El perfil de usuario ya existe');
        return;
      }
      
      // Crear perfil con rol de usuario por defecto
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          role_id: 3,
          is_active: true,
          full_name: sessionInfo.session.user.email.split('@')[0]
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      setStatus('Perfil de usuario creado correctamente');
    } catch (err) {
      console.error('Error al crear perfil:', err);
      setError(`Error al crear perfil: ${err.message}`);
      setStatus('Error al crear perfil');
    } finally {
      setLoading(false);
    }
  };

  // Función para intentar recuperar la sesión
  const handleRecoverSession = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('Intentando recuperar sesión...');
      
      const recovered = await recoverSession();
      
      if (recovered) {
        setStatus('Sesión recuperada correctamente');
        // Actualizar la información de la sesión
        const { data } = await supabase.auth.getSession();
        setSessionInfo(data);
      } else {
        setError('No se pudo recuperar la sesión. Intenta iniciar sesión nuevamente.');
        setStatus('Error al recuperar sesión');
      }
    } catch (err) {
      console.error('Error al recuperar sesión:', err);
      setError(`Error al recuperar sesión: ${err.message}`);
      setStatus('Error al recuperar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Función para reactivar un usuario desactivado
  const reactivateUser = async () => {
    if (!sessionInfo?.session?.user?.id) {
      setError('No hay usuario autenticado');
      return;
    }
    
    if (!isAdmin) {
      setError('Solo administradores pueden reactivar usuarios');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const userId = sessionInfo.session.user.id;
      
      // Actualizar el perfil para marcarlo como activo
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_active: true,
          disabled_at: null,
          reactivated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      setStatus('Usuario reactivado correctamente');
    } catch (err) {
      console.error('Error al reactivar usuario:', err);
      setError(`Error al reactivar usuario: ${err.message}`);
      setStatus('Error al reactivar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <img src={logo} alt="Hoom Logo" className="h-12 mb-4" />
          <CardTitle className="text-2xl font-bold">Acceso de Emergencia</CardTitle>
          <CardDescription>
            Herramientas para solucionar problemas de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Estado: <span className="font-medium">{status}</span>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!sessionInfo?.session ? (
            <form onSubmit={handleEmergencyLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión de Emergencia'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Button 
                  onClick={clearLocalStorage}
                  variant="outline"
                  className="flex items-center justify-center"
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpiar Almacenamiento Local
                </Button>
                
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="flex items-center justify-center"
                  disabled={loading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
                
                <Button 
                  onClick={checkCurrentSession}
                  variant="outline"
                  className="flex items-center justify-center"
                  disabled={loading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar Sesión
                </Button>
                
                <Button 
                  onClick={createUserProfile}
                  variant="secondary"
                  className="flex items-center justify-center"
                  disabled={loading}
                >
                  Crear Perfil de Usuario
                </Button>

                <Button 
                  onClick={handleRecoverSession}
                  variant="secondary"
                  className="flex items-center justify-center"
                  disabled={loading}
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Recuperar Sesión
                </Button>
                
                {isAdmin && (
                  <Button 
                    onClick={reactivateUser}
                    variant="default"
                    className="flex items-center justify-center"
                    disabled={loading}
                  >
                    Reactivar Usuario
                  </Button>
                )}
              </div>
              
              {sessionInfo && (
                <div className="mt-4">
                  <Label>Información de Sesión:</Label>
                  <div className="p-3 bg-gray-50 rounded-md mt-2 overflow-auto max-h-60">
                    <pre className="text-xs">
                      {JSON.stringify(sessionInfo, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {lastRefreshError && (
                <div className="mt-4">
                  <Label>Error de actualización de token:</Label>
                  <div className="p-3 bg-red-50 rounded-md mt-2 overflow-auto max-h-60">
                    <pre className="text-xs text-red-600">
                      {JSON.stringify(lastRefreshError, null, 2)}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Intentos de recuperación: {refreshAttempts}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground text-center">
            Esta página es solo para uso de emergencia. Utilízala únicamente si tienes problemas para acceder a la aplicación.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
