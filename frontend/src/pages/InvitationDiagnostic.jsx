import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { APP_URL, getAppUrl } from '@/config/appConfig';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';

export default function InvitationDiagnostic() {
  const [searchParams] = useSearchParams();
  const invitationCode = searchParams.get('code');
  const [loading, setLoading] = useState(true);
  const [invitationDetails, setInvitationDetails] = useState(null);
  const [error, setError] = useState(null);
  const [rpcResult, setRpcResult] = useState(null);
  const [directQueryResult, setDirectQueryResult] = useState(null);

  // Verificar el código de invitación usando RPC
  const checkWithRpc = async () => {
    setLoading(true);
    setError(null);
    setRpcResult(null);
    
    try {
      console.log('Verificando invitación con RPC:', invitationCode);
      const { data, error } = await supabase.rpc('verify_invitation', {
        code: invitationCode
      });

      if (error) throw error;
      
      setRpcResult(data);
      console.log('Resultado RPC:', data);
    } catch (err) {
      console.error('Error en RPC verify_invitation:', err);
      setError(`Error en RPC: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Verificar el código de invitación directamente en la tabla
  const checkWithDirectQuery = async () => {
    setLoading(true);
    setError(null);
    setDirectQueryResult(null);
    
    try {
      console.log('Verificando invitación con consulta directa:', invitationCode);
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('invitation_code', invitationCode)
        .single();

      if (error) throw error;
      
      setDirectQueryResult(data);
      console.log('Resultado consulta directa:', data);
    } catch (err) {
      console.error('Error en consulta directa:', err);
      setError(`Error en consulta directa: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar ambas verificaciones al cargar
  useEffect(() => {
    if (invitationCode) {
      checkWithRpc();
      checkWithDirectQuery();
    } else {
      setLoading(false);
      setError('No se proporcionó código de invitación');
    }
  }, [invitationCode]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <img src={logo} alt="Hoom Logo" className="h-12 mb-4" />
          <CardTitle className="text-2xl font-bold">Diagnóstico de Invitación</CardTitle>
          <CardDescription>
            Herramienta para diagnosticar problemas con códigos de invitación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Información de código</h3>
            <p className="text-blue-700">
              <span className="font-medium">Código analizado:</span> {invitationCode || 'No proporcionado'}
            </p>
            <p className="text-blue-700 mt-2">
              <span className="font-medium">URL de la aplicación:</span> {APP_URL}
            </p>
            <p className="text-blue-700 mt-2">
              <span className="font-medium">URL completa de registro:</span> {invitationCode ? getAppUrl(`/register?code=${invitationCode}`) : 'N/A'}
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
              <span>Verificando código de invitación...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Resultado de RPC */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verificación RPC</CardTitle>
                <CardDescription>
                  Resultado de la función RPC verify_invitation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rpcResult === null && !loading && !error ? (
                  <p className="text-amber-600">Sin resultados</p>
                ) : rpcResult ? (
                  <div className="space-y-2">
                    <p><span className="font-medium">Es válido:</span> {rpcResult.is_valid ? 'Sí' : 'No'}</p>
                    <p><span className="font-medium">Email:</span> {rpcResult.email || 'No disponible'}</p>
                    <p><span className="font-medium">Rol:</span> {rpcResult.role_id || 'No disponible'}</p>
                    <p><span className="font-medium">Mensaje:</span> {rpcResult.message || 'No hay mensaje'}</p>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={checkWithRpc}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar de nuevo
                </Button>
              </CardFooter>
            </Card>

            {/* Resultado de consulta directa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consulta Directa</CardTitle>
                <CardDescription>
                  Resultado de consulta directa a la tabla invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {directQueryResult === null && !loading && !error ? (
                  <p className="text-amber-600">Sin resultados</p>
                ) : directQueryResult ? (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">ID:</span> {directQueryResult.id}</p>
                    <p><span className="font-medium">Email:</span> {directQueryResult.email}</p>
                    <p><span className="font-medium">Código:</span> {directQueryResult.invitation_code}</p>
                    <p><span className="font-medium">Rol:</span> {directQueryResult.role_id}</p>
                    <p><span className="font-medium">Creado:</span> {formatDate(directQueryResult.created_at)}</p>
                    <p><span className="font-medium">Expira:</span> {formatDate(directQueryResult.expires_at)}</p>
                    <p><span className="font-medium">Usado:</span> {directQueryResult.used_at ? formatDate(directQueryResult.used_at) : 'No usado'}</p>
                    <p><span className="font-medium">Usuario:</span> {directQueryResult.user_id || 'No asignado'}</p>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={checkWithDirectQuery}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar de nuevo
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground text-center">
            Esta página es solo para diagnóstico. Utilízala para verificar problemas con códigos de invitación.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
