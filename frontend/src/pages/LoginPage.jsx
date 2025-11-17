import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Intentando iniciar sesión con:', { email });
      console.log('Llamando a supabase.auth.signInWithPassword');
      
      // No limpiamos localStorage - dejamos que Supabase maneje la persistencia
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Respuesta de signInWithPassword:', { 
        success: !error,
        hasData: !!data,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStatus: error?.status
      });

      if (error) {
        console.error('Detalles del error de autenticación:', {
          message: error.message,
          name: error.name,
          code: error.code,
          status: error.status,
          stack: error.stack
        });
        throw error;
      }

      console.log('Login exitoso, usuario:', data.user.id);
      
      // Verificar si el usuario tiene un perfil
      console.log('Verificando perfil de usuario');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 es "no se encontraron resultados"
        console.error('Error al verificar perfil:', profileError);
      }

      // Si no tiene perfil, crear uno con rol de usuario por defecto
      if (!profileData) {
        console.log('Creando perfil para usuario:', data.user.id);
        const { error: insertError } = await supabase.from('user_profiles').insert({
          id: data.user.id,
          role_id: 3, // rol de usuario por defecto
        });
        
        if (insertError) {
          console.error('Error al crear perfil:', insertError);
        } else {
          console.log('Perfil creado exitosamente');
        }
      } else {
        console.log('Perfil existente encontrado:', profileData);
      }

      // Verificar la sesión antes de redirigir
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Sesión actual después de login:', sessionData);

      // Redirigir a la página principal
      console.log('Redirigiendo a la página principal');
      navigate('/');
    } catch (error) {
      console.error('Error de login:', error);
      console.error('Tipo de error:', typeof error);
      console.error('Propiedades del error:', Object.keys(error));
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <img src={logo} alt="Hoom Logo" className="h-12 mb-4" />
          <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs text-blue-600" 
                  type="button"
                  onClick={() => navigate('/reset-password')}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Acceso solo por invitación. Contacta al administrador si necesitas una cuenta.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
