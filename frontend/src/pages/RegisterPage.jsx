import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const invitationCode = searchParams.get('code');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [invitationValid, setInvitationValid] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Verificar el código de invitación
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!invitationCode) {
        setVerifyingCode(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('verify_invitation', {
          code: invitationCode
        });

        if (error) throw error;

        if (data && data.is_valid) {
          setInvitationValid(true);
          setEmail(data.email || '');
        } else {
          setError('El código de invitación no es válido o ha expirado.');
        }
      } catch (error) {
        console.error('Error al verificar invitación:', error);
        setError('Error al verificar el código de invitación.');
      } finally {
        setVerifyingCode(false);
      }
    };

    verifyInvitation();
  }, [invitationCode]);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Registrar el usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Marcar la invitación como utilizada
        const { data: useInvData, error: useInvError } = await supabase.rpc('use_invitation', {
          code: invitationCode,
          user_id: authData.user.id
        });

        if (useInvError) throw useInvError;

        // Actualizar el nombre completo en el perfil
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ full_name: fullName })
          .eq('id', authData.user.id);

        if (profileError) console.error('Error al actualizar perfil:', profileError);

        // Redirigir a la página principal
        navigate('/');
      }
    } catch (error) {
      console.error('Error de registro:', error);
      setError(error.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  // Si estamos verificando el código, mostrar un loader
  if (verifyingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Verificando código de invitación...</p>
        </div>
      </div>
    );
  }

  // Si no hay código o no es válido, mostrar mensaje de error
  if (!invitationCode || !invitationValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <img src={logo} alt="Hoom Logo" className="h-12 mb-4" />
            <CardTitle className="text-2xl font-bold">Acceso denegado</CardTitle>
            <CardDescription>
              {error || 'Se requiere un código de invitación válido para registrarse.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Ir a inicio de sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Si el código es válido, mostrar formulario de registro
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <img src={logo} alt="Hoom Logo" className="h-12 mb-4" />
          <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
          <CardDescription>
            Completa tu información para registrarte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!email} // Deshabilitar si ya viene en la invitación
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creando cuenta...
                </>
              ) : (
                'Registrarse'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta? <a href="/login" className="text-primary hover:underline">Iniciar sesión</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
