import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FraccionamientosPage() {
  const [fraccionamientos, setFraccionamientos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFraccionamientos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fraccionamientos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setFraccionamientos(data || []);
    } catch (error) {
      console.error('Error fetching fraccionamientos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los fraccionamientos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraccionamientos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      setLoading(true);
      
      if (editingId) {
        // Update existing fraccionamiento
        const { error } = await supabase
          .from('fraccionamientos')
          .update({ nombre: nombre.trim() })
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: '¡Listo!',
          description: 'Fraccionamiento actualizado correctamente',
        });
      } else {
        // Create new fraccionamiento
        const { error } = await supabase
          .from('fraccionamientos')
          .insert([{ nombre: nombre.trim() }]);

        if (error) throw error;
        
        toast({
          title: '¡Listo!',
          description: 'Fraccionamiento creado correctamente',
        });
      }

      setNombre('');
      setEditingId(null);
      fetchFraccionamientos();
    } catch (error) {
      console.error('Error saving fraccionamiento:', error);
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fracc) => {
    setNombre(fracc.nombre);
    setEditingId(fracc.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este fraccionamiento?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('fraccionamientos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Eliminado',
        description: 'Fraccionamiento eliminado correctamente',
      });
      
      fetchFraccionamientos();
    } catch (error) {
      console.error('Error deleting fraccionamiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el fraccionamiento. Asegúrate de que no esté en uso.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Fraccionamientos</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">
          {editingId ? 'Editar Fraccionamiento' : 'Agregar Nuevo Fraccionamiento'}
        </h2>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="Nombre del fraccionamiento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={!nombre.trim() || loading}>
            {loading ? (
              'Guardando...'
            ) : editingId ? (
              <Pencil className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {editingId ? 'Actualizar' : 'Agregar'}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNombre('');
                setEditingId(null);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-32">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fraccionamientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  {loading ? 'Cargando...' : 'No hay fraccionamientos registrados'}
                </TableCell>
              </TableRow>
            ) : (
              fraccionamientos.map((fracc) => (
                <TableRow key={fracc.id}>
                  <TableCell className="font-medium">{fracc.id}</TableCell>
                  <TableCell>{fracc.nombre}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(fracc)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(fracc.id)}
                        disabled={loading}
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
