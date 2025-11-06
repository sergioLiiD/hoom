import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function FixRolePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        
        // Verificar si hay un usuario autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setError('No hay usuario autenticado. Por favor inicia sesión primero.');
          setLoading(false);
          return;
        }

        setUser(user);
        
        // Verificar si existe el perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          setError(`Error al verificar el perfil: ${profileError.message}`);
          setLoading(false);
          return;
        }
        
        setUserProfile(profileData);
        
        // Verificar si existe el rol de owner
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('name', 'owner')
          .single();
        
        if (roleError) {
          setError(`Error al verificar el rol de owner: ${roleError.message}`);
          setLoading(false);
          return;
        }
        
        setUserRole(roleData);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError(`Error inesperado: ${error.message}`);
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);
  
  const fixUserRole = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!user) {
        setError('No hay usuario autenticado.');
        setLoading(false);
        return;
      }
      
      if (!userRole) {
        setError('No se encontró el rol de owner.');
        setLoading(false);
        return;
      }
      
      // Si no existe el perfil, crearlo
      if (!userProfile) {
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            full_name: 'Sergio Velazco',
            role_id: userRole.id
          })
          .select()
          .single();
        
        if (error) {
          setError(`Error al crear el perfil: ${error.message}`);
          setLoading(false);
          return;
        }
        
        setUserProfile(data);
        setSuccess('Se ha creado el perfil de usuario con rol de owner.');
      } else {
        // Si existe el perfil, actualizar el rol
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ role_id: userRole.id })
          .eq('id', user.id)
          .select()
          .single();
        
        if (error) {
          setError(`Error al actualizar el perfil: ${error.message}`);
          setLoading(false);
          return;
        }
        
        setUserProfile(data);
        setSuccess('Se ha actualizado el perfil de usuario con rol de owner.');
      }
      
      setFixed(true);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError(`Error inesperado: ${error.message}`);
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Verificando usuario y permisos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Herramienta de corrección de permisos</CardTitle>
          <CardDescription>
            Esta herramienta verifica y corrige los permisos de tu usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Estado actual:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  <strong>Usuario:</strong> {user ? user.email : 'No autenticado'}
                </li>
                <li>
                  <strong>ID de usuario:</strong> {user ? user.id : 'N/A'}
                </li>
                <li>
                  <strong>Perfil:</strong> {userProfile ? 'Encontrado' : 'No encontrado'}
                  {userProfile && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      (ID: {userProfile.id}, Rol: {userProfile.role_id})
                    </span>
                  )}
                </li>
                <li>
                  <strong>Rol de Owner:</strong> {userRole ? `Encontrado (ID: ${userRole.id})` : 'No encontrado'}
                </li>
              </ul>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                  <p className="text-green-800">{success}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={fixUserRole} 
            disabled={loading || fixed}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : fixed ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Permisos corregidos
              </>
            ) : (
              'Corregir permisos'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
