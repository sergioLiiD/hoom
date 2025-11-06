import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, RefreshCw, Key } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function TestSupabase() {
  const [status, setStatus] = useState('Checking Supabase configuration...');
  const [error, setError] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    async function checkSupabase() {
      try {
        // Get Supabase URL for display
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not available';
        setConnectionInfo({ url: supabaseUrl });
        
        // Check if we can connect to Supabase
        const { data, error } = await supabase.from('user_roles').select('*').limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
          setStatus('Error connecting to Supabase');
          setError(error.message);
          return;
        }
        
        setStatus('Successfully connected to Supabase');
        setConnectionInfo(prev => ({
          ...prev,
          data: data,
          connected: true
        }));
      } catch (err) {
        console.error('Unexpected error:', err);
        setStatus('Unexpected error');
        setError(err.message);
      }
    }
    
    checkSupabase();
  }, []);

  // Función mejorada para login con más logs de depuración
  const handleTestLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginStatus(null);
    setLoginError(null);
    setDebugInfo(null);

    try {
      console.log('Intentando iniciar sesión con:', { email });
      
      console.log('Llamando a supabase.auth.signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Respuesta de signInWithPassword:', { data, error });
      
      const debugData = {
        responseData: data,
        responseError: error ? {
          message: error.message,
          status: error.status,
          name: error.name,
          code: error.code
        } : null,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(debugData);

      if (error) {
        console.error('Login error:', error);
        console.error('Tipo de error:', typeof error);
        console.error('Propiedades del error:', Object.keys(error));
        setLoginError(error.message);
        setLoginStatus('Error');
      } else {
        setLoginStatus('Success');
        console.log('Login successful:', data);
        
        // Verificar la sesión inmediatamente después del login
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Sesión actual después de login:', sessionData);
        setSessionInfo(sessionData);
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      console.error('Tipo de error inesperado:', typeof err);
      console.error('Propiedades del error inesperado:', Object.keys(err));
      setLoginError(err.message || err.toString());
      setLoginStatus('Error');
      
      setDebugInfo({
        unexpectedError: err.toString(),
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Función para login simplificado (sin manejo de estado de UI complejo)
  const handleSimpleLogin = async () => {
    try {
      setLoading(true);
      console.log('Intentando login simple con:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Respuesta completa de login simple:', { data, error });
      
      if (error) {
        setLoginError(JSON.stringify(error, null, 2));
        setLoginStatus('Error');
      } else {
        setLoginStatus('Success');
        console.log('Usuario autenticado:', data.user);
        
        // Verificar la sesión inmediatamente
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Sesión actual después de login simple:', sessionData);
        setSessionInfo(sessionData);
      }
    } catch (err) {
      console.error('Error inesperado en login simple:', err);
      setLoginError(err.toString());
      setLoginStatus('Error');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para limpiar el almacenamiento local
  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      alert('Almacenamiento local limpiado correctamente');
      console.log('Almacenamiento local limpiado');
    } catch (err) {
      console.error('Error al limpiar almacenamiento:', err);
      alert('Error al limpiar almacenamiento: ' + err.message);
    }
  };
  
  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
      } else {
        console.log('Sesión cerrada correctamente');
        setSessionInfo(null);
        alert('Sesión cerrada correctamente');
      }
    } catch (err) {
      console.error('Error inesperado al cerrar sesión:', err);
      alert('Error inesperado al cerrar sesión: ' + err.message);
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
        alert('Error al verificar sesión: ' + error.message);
      } else {
        console.log('Sesión actual:', data);
        setSessionInfo(data);
        alert(data.session ? 'Sesión activa encontrada' : 'No hay sesión activa');
      }
    } catch (err) {
      console.error('Error inesperado al verificar sesión:', err);
      alert('Error inesperado al verificar sesión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <Tabs defaultValue="connection" className="w-full max-w-3xl">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="connection">Conexión</TabsTrigger>
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="session">Sesión</TabsTrigger>
          <TabsTrigger value="debug">Depuración</TabsTrigger>
        </TabsList>
        
        {/* Tab: Connection Status */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Conexión</CardTitle>
              <CardDescription>Prueba de conexión a Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Estado:</strong> {status}</p>
                {connectionInfo && (
                  <div>
                    <p><strong>URL de Supabase:</strong> {connectionInfo.url}</p>
                    {connectionInfo.connected && (
                      <p><strong>Conexión:</strong> Exitosa</p>
                    )}
                  </div>
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Login Test */}
        <TabsContent value="login" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prueba de Login</CardTitle>
              <CardDescription>Prueba de autenticación con Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="test@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {loginStatus && (
                  <Alert variant={loginStatus === 'Success' ? 'default' : 'destructive'}>
                    <AlertDescription>
                      {loginStatus === 'Success' 
                        ? '¡Login exitoso!' 
                        : loginError || 'Login fallido'}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Probando Login...
                      </>
                    ) : (
                      'Login Normal'
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleSimpleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="mr-2 h-4 w-4" />
                    )}
                    Login Simple
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Session Management */}
        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Sesión</CardTitle>
              <CardDescription>Herramientas para gestionar la sesión y el almacenamiento local</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={clearLocalStorage} 
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar Almacenamiento Local
                  </Button>
                  
                  <Button 
                    onClick={handleSignOut} 
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="mr-2 h-4 w-4" />
                    )}
                    Cerrar Sesión
                  </Button>
                </div>
                
                <Button 
                  onClick={checkCurrentSession} 
                  variant="secondary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Verificar Sesión Actual
                </Button>
                
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Debug Information */}
        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de Depuración</CardTitle>
              <CardDescription>Detalles técnicos para solucionar problemas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Información de Supabase:</Label>
                  <Textarea 
                    readOnly 
                    className="font-mono text-xs mt-2" 
                    value={JSON.stringify({
                      url: connectionInfo?.url || 'No disponible',
                      version: '@supabase/supabase-js',
                      connected: connectionInfo?.connected || false
                    }, null, 2)}
                  />
                </div>
                
                {debugInfo && (
                  <div>
                    <Label>Datos de Depuración:</Label>
                    <Textarea 
                      readOnly 
                      className="font-mono text-xs mt-2 h-60" 
                      value={JSON.stringify(debugInfo, null, 2)}
                    />
                  </div>
                )}
                
                <div>
                  <Label>Entorno:</Label>
                  <Textarea 
                    readOnly 
                    className="font-mono text-xs mt-2" 
                    value={JSON.stringify({
                      userAgent: navigator.userAgent,
                      language: navigator.language,
                      platform: navigator.platform,
                      cookiesEnabled: navigator.cookieEnabled,
                      timestamp: new Date().toISOString()
                    }, null, 2)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
