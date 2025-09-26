import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import PromoterForm from '@/components/PromoterForm';

export default function PromotersPage() {
  const [promoters, setPromoters] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPromoter, setSelectedPromoter] = useState(null);

  const fetchPromoters = async () => {
    const { data } = await supabase.from('promoters').select('*').order('name');
    setPromoters(data || []);
  };

  useEffect(() => {
    fetchPromoters();
  }, []);

  const handleSave = async (promoterData) => {
    if (selectedPromoter) {
      // Update
      const { error } = await supabase.from('promoters').update(promoterData).eq('id', selectedPromoter.id);
      if (error) console.error('Error updating promoter:', error);
    } else {
      // Create
      const { error } = await supabase.from('promoters').insert([promoterData]);
      if (error) console.error('Error creating promoter:', error);
    }
    fetchPromoters();
    setIsDialogOpen(false);
    setSelectedPromoter(null);
  };

  const handleDelete = async (promoterId) => {
    if (window.confirm('¿Estás seguro?')) {
      const { error } = await supabase.from('promoters').delete().eq('id', promoterId);
      if (error) console.error('Error deleting promoter:', error);
      else fetchPromoters();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestión de Promotores</h1>
          <p className="text-muted-foreground">Añade, edita y elimina promotores.</p>
        </div>
        <Button onClick={() => { setSelectedPromoter(null); setIsDialogOpen(true); }}>Añadir Promotor</Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Compañía</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promoters.map(promoter => (
              <TableRow key={promoter.id}>
                <TableCell>{promoter.name}</TableCell>
                <TableCell>{promoter.company}</TableCell>
                <TableCell>{promoter.phone}</TableCell>
                <TableCell>{promoter.email}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => { setSelectedPromoter(promoter); setIsDialogOpen(true); }}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(promoter.id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPromoter ? 'Editar Promotor' : 'Añadir Promotor'}</DialogTitle>
          </DialogHeader>
          <PromoterForm 
            promoter={selectedPromoter} 
            onSave={handleSave} 
            onCancel={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
