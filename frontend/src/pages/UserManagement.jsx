import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, UserX, UserCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'

  // Cargar usuarios
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Cargando usuarios...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role_id, created_at, is_active, disabled_at, reactivated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Intentar obtener emails para cada usuario (esto puede fallar por permisos)
      const usersWithEmail = await Promise.all(data.map(async (user) => {
        try {
          // Intentar obtener el email del usuario desde auth.users
          const { data: userData, error: userError } = await supabase
            .rpc('get_user_email', { target_user_id: user.id });
            
          return {
            ...user,
            email: userData?.email || 'N/A',
            is_active: user.is_active !== false // Si is_active es null o undefined, consideramos que está activo
          };
        } catch (err) {
          console.error(`Error al obtener email para usuario ${user.id}:`, err);
          return {
            ...user,
            email: 'N/A',
            is_active: user.is_active !== false
          };
        }
      }));
      
      setUsers(usersWithEmail);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError(`Error al cargar usuarios: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Desactivar usuario
  const handleDisableUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este usuario? El usuario no podrá acceder a la plataforma, pero sus datos se conservarán.')) {
      return;
    }
    
    setActionStatus({ type: 'loading', message: 'Desactivando usuario...' });
    
    try {
      console.log('Desactivando usuario:', userId);
      const { data, error } = await supabase.rpc('disable_user', {
        target_user_id: userId
      });

      if (error) throw error;

      setActionStatus({ type: 'success', message: 'Usuario desactivado correctamente' });
      fetchUsers(); // Recargar la lista de usuarios
    } catch (err) {
      console.error('Error al desactivar usuario:', err);
      setActionStatus({ type: 'error', message: `Error al desactivar usuario: ${err.message}` });
    }
  };
  
  // Reactivar usuario
  const handleReactivateUser = async (userId) => {
    if (!confirm('¿Estás seguro de que deseas reactivar este usuario? El usuario podrá acceder nuevamente a la plataforma.')) {
      return;
    }
    
    setActionStatus({ type: 'loading', message: 'Reactivando usuario...' });
    
    try {
      console.log('Reactivando usuario:', userId);
      const { data, error } = await supabase.rpc('reactivate_user', {
        target_user_id: userId
      });

      if (error) throw error;

      setActionStatus({ type: 'success', message: 'Usuario reactivado correctamente' });
      fetchUsers(); // Recargar la lista de usuarios
    } catch (err) {
      console.error('Error al reactivar usuario:', err);
      setActionStatus({ type: 'error', message: `Error al reactivar usuario: ${err.message}` });
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
  
  // Filtrar usuarios según búsqueda y estado activo
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesActiveFilter = 
      filterActive === 'all' || 
      (filterActive === 'active' && user.is_active) || 
      (filterActive === 'inactive' && !user.is_active);
      
    return matchesSearch && matchesActiveFilter;
  });

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>
      
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle>Gestión avanzada de usuarios</CardTitle>
          <CardDescription>
            Herramienta para desactivar y reactivar usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Importante: Sobre la eliminación de usuarios</h3>
                <p className="text-amber-700 text-sm">
                  Por motivos de integridad de datos, los usuarios no se eliminan completamente de la base de datos.
                  En su lugar, se <strong>desactivan</strong>, lo que impide su acceso a la plataforma pero mantiene
                  sus registros y relaciones con otros datos.
                </p>
              </div>
            </div>
          </div>
          
          {actionStatus && (
            <Alert 
              variant={actionStatus.type === 'error' ? 'destructive' : 'default'}
              className={actionStatus.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : ''}
            >
              <AlertDescription>
                {actionStatus.type === 'loading' ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {actionStatus.message}
                  </div>
                ) : (
                  actionStatus.message
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar usuarios</Label>
                <Input
                  id="search"
                  placeholder="Buscar por nombre, email o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full sm:w-48">
                <Label htmlFor="filter">Filtrar por estado</Label>
                <select
                  id="filter"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
              
              <div className="w-full sm:w-auto self-end">
                <Button 
                  variant="outline" 
                  onClick={fetchUsers}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id} className={!user.is_active ? 'bg-gray-50' : ''}>
                          <TableCell className="font-mono text-xs truncate max-w-[100px]" title={user.id}>
                            {user.id}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
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
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            {/* No mostrar acciones para el usuario actual */}
                            {user.id !== currentUser?.id && (
                              user.is_active ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDisableUser(user.id)}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Desactivar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1 text-green-500 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleReactivateUser(user.id)}
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Reactivar
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Total: {filteredUsers.length} usuarios
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
