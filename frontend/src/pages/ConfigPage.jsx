import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Mail, ShieldCheck, UserPlus, Check, X, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAppUrl } from '@/config/appConfig';

export default function ConfigPage() {
  const [activeSection, setActiveSection] = useState('invitations');
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role_id: '3', // Default: user role
  });
  const [invitationResult, setInvitationResult] = useState(null);
  const [invitationError, setInvitationError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        // Intentamos obtener los usuarios directamente
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, role_id, created_at, is_active, disabled_at, reactivated_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error al cargar perfiles de usuario:', error);
          setUsers([]);
          setLoadingUsers(false);
          return;
        }

        // Si tenemos datos, los mostramos directamente sin intentar obtener emails
        // Esto es una solución temporal hasta que se resuelvan los problemas de permisos
        setUsers(data.map(user => ({
          ...user,
          email: 'N/A', // No podemos obtener emails por ahora
          is_active: user.is_active !== false // Si is_active es null o undefined, consideramos que está activo
        })));
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [refreshTrigger]);

  // Cargar invitaciones
  useEffect(() => {
    const fetchInvitations = async () => {
      setLoadingInvitations(true);
      try {
        // Intentamos obtener las invitaciones con una consulta más simple
        const { data, error } = await supabase
          .from('invitations')
          .select('id, email, role_id, created_at, expires_at, used_at, invitation_code')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error al cargar invitaciones:', error);
          setInvitations([]);
          setLoadingInvitations(false);
          return;
        }
        
        setInvitations(data || []);
      } catch (error) {
        console.error('Error al cargar invitaciones:', error);
        setInvitations([]);
      } finally {
        setLoadingInvitations(false);
      }
    };

    fetchInvitations();
  }, [refreshTrigger]);

  // Crear nueva invitación
  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    setInvitationResult(null);
    setInvitationError(null);
    
    try {
      const { data, error } = await supabase.rpc('create_invitation', {
        user_email: newInvitation.email,
        assigned_role: parseInt(newInvitation.role_id),
        days_valid: 7
      });

      if (error) throw error;

      // Obtener los detalles de la invitación creada
      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .select('invitation_code, expires_at')
        .eq('id', data)
        .single();

      if (invitationError) throw invitationError;

      setInvitationResult({
        email: newInvitation.email,
        code: invitationData.invitation_code,
        expires_at: invitationData.expires_at
      });
      
      setNewInvitation({
        email: '',
        role_id: '3'
      });
      
      // Actualizar la lista de invitaciones
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error al crear invitación:', error);
      setInvitationError(error.message || 'Error al crear la invitación');
    }
  };

  // Borrar invitación
  const handleDeleteInvitation = async (invitationId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta invitación?')) {
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('delete_invitation', {
        invitation_id: invitationId
      });

      if (error) throw error;

      if (data) {
        // Actualizar la lista de invitaciones
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert('No se pudo eliminar la invitación. Es posible que ya haya sido utilizada.');
      }
    } catch (error) {
      console.error('Error al eliminar invitación:', error);
      alert(`Error al eliminar la invitación: ${error.message || 'Error desconocido'}`);
    }
  };
  
  // Desactivar usuario (en lugar de eliminarlo)
  const handleDisableUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este usuario? El usuario no podrá acceder a la plataforma, pero sus datos se conservarán.')) {
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('disable_user', {
        target_user_id: userId
      });

      if (error) throw error;

      // Actualizar la lista de usuarios
      setRefreshTrigger(prev => prev + 1);
      alert('Usuario desactivado correctamente.');
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      alert(`Error al desactivar el usuario: ${error.message || 'Error desconocido'}`);
    }
  };
  
  // Reactivar usuario
  const handleReactivateUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas reactivar este usuario? El usuario podrá acceder nuevamente a la plataforma.')) {
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('reactivate_user', {
        target_user_id: userId
      });

      if (error) throw error;

      // Actualizar la lista de usuarios
      setRefreshTrigger(prev => prev + 1);
      alert('Usuario reactivado correctamente.');
    } catch (error) {
      console.error('Error al reactivar usuario:', error);
      alert(`Error al reactivar el usuario: ${error.message || 'Error desconocido'}`);
    }
  };
  
  // Ver historial de actividad de un usuario
  const handleViewUserHistory = async (userId) => {
    try {
      const { data, error } = await supabase.rpc('get_user_activity_history', {
        target_user_id: userId
      });

      if (error) throw error;

      // Mostrar el historial en una alerta (en una aplicación real, esto sería una modal o una página separada)
      if (data && data.length > 0) {
        const historyText = data.map(item => {
          return `${new Date(item.created_at).toLocaleString()}: ${item.action_type} por ${item.performer_name || 'Usuario desconocido'}`;
        }).join('\n');
        
        alert(`Historial de actividad:\n\n${historyText}`);
      } else {
        alert('No hay historial de actividad para este usuario.');
      }
    } catch (error) {
      console.error('Error al obtener historial de usuario:', error);
      alert(`Error al obtener historial: ${error.message || 'Error desconocido'}`);
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  // Función para obtener el nombre del rol
  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1: return 'Owner';
      case 2: return 'Admin';
      case 3: return 'Usuario';
      default: return 'Desconocido';
    }
  };
  
  // Función para obtener el estado del usuario
  const getUserStatus = (isActive) => {
    return isActive === false ? 'Inactivo' : 'Activo';
  };
  
  // Función para obtener el color del estado
  const getUserStatusColor = (isActive) => {
    return isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  // Función para verificar si una invitación está expirada
  const isExpired = (expiresAt) => {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold mb-4">Panel de Administración</h2>
          <p className="text-lg mb-6">
            Esta sección está diseñada para gestionar usuarios e invitaciones en la plataforma.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 max-w-2xl w-full">
            <h3 className="font-semibold text-blue-800 mb-2">Información</h3>
            <p className="text-blue-700 mb-2">
              Panel de administración para gestionar usuarios e invitaciones.
            </p>
            <p className="text-blue-700">
              Desde aquí puedes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-blue-700 text-left">
              <li>Ver todos los usuarios registrados en la plataforma</li>
              <li>Crear invitaciones para nuevos usuarios</li>
              <li>Asignar roles a los usuarios (Owner, Admin, Usuario)</li>
              <li>Gestionar el acceso a la plataforma</li>
            </ul>
          </div>
          
          <div className="flex gap-4 mb-6">
            <Button 
              variant={activeSection === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveSection('users')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Usuarios
            </Button>
            <Button 
              variant={activeSection === 'invitations' ? 'default' : 'outline'}
              onClick={() => setActiveSection('invitations')}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Invitaciones
            </Button>
          </div>
          
          {activeSection === 'users' && (
            <Card className="w-full max-w-4xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Usuarios registrados</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
                <CardDescription>
                  Lista de todos los usuarios registrados en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha de registro</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              No hay usuarios registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.email || 'N/A'}</TableCell>
                              <TableCell>{user.full_name || 'Sin nombre'}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.role_id === 1 ? 'bg-purple-100 text-purple-800' : 
                                  user.role_id === 2 ? 'bg-blue-100 text-blue-800' : 
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {getRoleName(user.role_id)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${getUserStatusColor(user.is_active)}`}>
                                  {getUserStatus(user.is_active)}
                                </span>
                              </TableCell>
                              <TableCell>{formatDate(user.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-2">
                                  {user.is_active !== false ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDisableUser(user.id)}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                      </svg>
                                      Desactivar
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex items-center gap-1 text-green-500 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleReactivateUser(user.id)}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="16"></line>
                                        <line x1="8" y1="12" x2="16" y2="12"></line>
                                      </svg>
                                      Reactivar
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleViewUserHistory(user.id)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    Historial
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeSection === 'invitations' && (
            <div className="grid gap-6 md:grid-cols-2 w-full max-w-4xl">
              {/* Formulario para crear invitaciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Crear nueva invitación</CardTitle>
                  <CardDescription>
                    Invita a nuevos usuarios a unirse a la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateInvitation} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={newInvitation.email}
                        onChange={(e) => setNewInvitation({...newInvitation, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol</Label>
                      <Select
                        value={newInvitation.role_id}
                        onValueChange={(value) => setNewInvitation({...newInvitation, role_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Owner</SelectItem>
                          <SelectItem value="2">Admin</SelectItem>
                          <SelectItem value="3">Usuario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {invitationError && (
                      <Alert variant="destructive">
                        <AlertDescription>{invitationError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button type="submit" className="w-full">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Crear invitación
                    </Button>
                  </form>
                </CardContent>
                
                {invitationResult && (
                  <CardFooter className="flex flex-col items-start">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 w-full">
                      <h4 className="font-semibold text-green-800 mb-2">¡Invitación creada!</h4>
                      <p className="text-sm mb-2">
                        <span className="font-medium">Email:</span> {invitationResult.email}
                      </p>
                      <p className="text-sm mb-2">
                        <span className="font-medium">Código:</span> {invitationResult.code}
                      </p>
                      <p className="text-sm mb-2">
                        <span className="font-medium">Expira:</span> {formatDate(invitationResult.expires_at)}
                      </p>
                      
                      <div className="mt-3 p-2 bg-white border border-green-100 rounded-md">
                        <p className="text-sm font-medium text-green-800 mb-1">Enlace de invitación:</p>
                        <div className="flex items-center">
                          <input 
                            type="text" 
                            readOnly 
                            value={getAppUrl(`/register?code=${invitationResult.code}`)}
                            className="text-xs p-2 flex-1 bg-white border border-green-200 rounded-l-md focus:outline-none"
                          />
                          <Button
                            size="sm"
                            className="rounded-l-none bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              navigator.clipboard.writeText(getAppUrl(`/register?code=${invitationResult.code}`));
                              alert('Enlace copiado al portapapeles');
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-green-700 mt-3">
                        Comparte este enlace con el usuario para que pueda registrarse directamente.
                      </p>
                    </div>
                  </CardFooter>
                )}
              </Card>
              
              {/* Lista de invitaciones */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Invitaciones</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setRefreshTrigger(prev => prev + 1)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                  </div>
                  <CardDescription>
                    Lista de todas las invitaciones creadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInvitations ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Expira</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invitations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                No hay invitaciones creadas
                              </TableCell>
                            </TableRow>
                          ) : (
                            invitations.map((invitation) => (
                              <TableRow key={invitation.id}>
                                <TableCell>{invitation.email}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    invitation.role_id === 1 ? 'bg-purple-100 text-purple-800' : 
                                    invitation.role_id === 2 ? 'bg-blue-100 text-blue-800' : 
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {getRoleName(invitation.role_id)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {invitation.used_at ? (
                                    <span className="inline-flex items-center text-green-600">
                                      <Check className="h-4 w-4 mr-1" />
                                      Usada
                                    </span>
                                  ) : isExpired(invitation.expires_at) ? (
                                    <span className="inline-flex items-center text-red-600">
                                      <X className="h-4 w-4 mr-1" />
                                      Expirada
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-amber-600">
                                      <Clock className="h-4 w-4 mr-1" />
                                      Pendiente
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    {!invitation.used_at && !isExpired(invitation.expires_at) && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex items-center gap-1"
                                          onClick={() => {
                                            navigator.clipboard.writeText(getAppUrl(`/register?code=${invitation.invitation_code}`));
                                            alert('Enlace copiado al portapapeles');
                                          }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                          </svg>
                                          Copiar
                                        </Button>
                                        
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleDeleteInvitation(invitation.id)}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                          </svg>
                                          Eliminar
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
