import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

export default function PromoterForm({ promoter, onSave, onCancel }) {
  const [formData, setFormData] = useState(promoter || {});

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Compañía</Label>
          <Input id="company" value={formData.company || ''} onChange={(e) => handleChange('company', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar</Button>
      </DialogFooter>
    </form>
  );
}
