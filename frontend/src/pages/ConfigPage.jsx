import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Users, Mail, Calendar, Check, X, Clock, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ConfigPage() {
  const { user, userRole, isOwner } = useAuth();
  
  console.log('ConfigPage - Auth State:', { 
    user: user?.id, 
    userRole, 
    isOwner,
    roleId: userRole?.id,
    roleName: userRole?.name
  });
  
  // Temporalmente deshabilitamos la verificación de rol
  // if (!isOwner) {
  //   return (
  //     <div className="container py-6">
  //       <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
  //         <h1 className="text-3xl font-bold mb-4">Acceso Denegado</h1>
  //         <p className="text-lg mb-6">No tienes permisos para acceder a esta sección.</p>
  //         <p className="text-muted-foreground">Esta sección está reservada para administradores con rol de owner.</p>
  //       </div>
  //     </div>
  //   );
  // }
  const [activeTab, setActiveTab] = useState('users');
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
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, role_id, created_at, user_roles(name), auth_users:id(email, last_sign_in_at)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
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
        const { data, error } = await supabase
          .from('invitations')
          .select('*, user_roles(name), creator:created_by(email)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInvitations(data || []);
      } catch (error) {
        console.error('Error al cargar invitaciones:', error);
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

  // Función para verificar si una invitación está expirada
  const isExpired = (expiresAt) => {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="h-4 w-4 mr-2" />
            Invitaciones
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Usuarios registrados</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setRefreshTrigger(prev => prev + 1)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </CardTitle>
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
                        <TableHead>Fecha de registro</TableHead>
                        <TableHead>Último acceso</TableHead>
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
                            <TableCell>{user.auth_users?.email || 'N/A'}</TableCell>
                            <TableCell>{user.full_name || 'Sin nombre'}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role_id === 1 ? 'bg-purple-100 text-purple-800' : 
                                user.role_id === 2 ? 'bg-blue-100 text-blue-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.user_roles?.name || getRoleName(user.role_id)}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell>{formatDate(user.auth_users?.last_sign_in_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invitations">
          <div className="grid gap-6 md:grid-cols-2">
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
                        {isOwner && (
                          <SelectItem value="1">Owner</SelectItem>
                        )}
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
                    <p className="text-sm mb-4">
                      <span className="font-medium">Expira:</span> {formatDate(invitationResult.expires_at)}
                    </p>
                    <p className="text-xs text-green-700">
                      Comparte este código con el usuario para que pueda registrarse.
                    </p>
                  </div>
                </CardFooter>
              )}
            </Card>
            
            {/* Lista de invitaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Invitaciones</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </CardTitle>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
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
                                  {invitation.user_roles?.name || getRoleName(invitation.role_id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
