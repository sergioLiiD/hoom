import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Star } from 'lucide-react';

export default function PhotoEditor({ property, onSave, onCancel }) {
  const [photos, setPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPhotos(property?.photos ? [...property.photos] : []);
  }, [property]);

  const handleSetMain = (photoToMakeMain) => {
    console.log('Setting main photo:', photoToMakeMain);
    const reorderedPhotos = [photoToMakeMain, ...photos.filter(p => p !== photoToMakeMain)];
    setPhotos(reorderedPhotos);
    console.log('New photo order:', reorderedPhotos);
  };

  const handleDelete = (photoToDelete) => {
    console.log('Deleting photo:', photoToDelete);
    if (window.confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
      const updatedPhotos = photos.filter(p => p !== photoToDelete);
      setPhotos(updatedPhotos);
      console.log('Remaining photos:', updatedPhotos);
    }
  };

  const handleSaveChanges = async () => {
    console.log('Saving changes to Supabase...');
    setIsSaving(true);
    const { data, error } = await supabase
      .from('properties')
      .update({ photos: photos })
      .eq('id', property.id);

    if (error) {
      console.error('Error updating photos:', error);
      // Handle error notification
    } else {
      console.log('Successfully saved photos.');
      onSave();
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={!!property} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Fotos de "{property?.title}"</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4 max-h-[70vh] overflow-y-auto">
          {photos.map((photo, index) => (
            <div key={photo} className="relative group border-2 border-transparent rounded-md overflow-hidden">
              <img src={photo} alt={`Property photo ${index + 1}`} className="w-full h-40 object-cover" />
              <div className="absolute top-0 right-0 p-1 bg-black bg-opacity-50 rounded-bl-md flex gap-2">
                <button onClick={() => handleSetMain(photo)} className={`text-white hover:text-yellow-400 ${index === 0 ? 'text-yellow-400' : ''}`} title="Hacer principal">
                  <Star className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(photo)} className="text-white hover:text-red-500" title="Eliminar foto">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-1">Principal</div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
