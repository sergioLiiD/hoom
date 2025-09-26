import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const PropertyFilters = ({ filters, setFilters, onFilter }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="minPrice">Precio Mín.</Label>
          <Input id="minPrice" name="minPrice" type="number" value={filters.minPrice || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="maxPrice">Precio Máx.</Label>
          <Input id="maxPrice" name="maxPrice" type="number" value={filters.maxPrice || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="minBeds">Habitaciones Mín.</Label>
          <Input id="minBeds" name="minBeds" type="number" value={filters.minBeds || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="minBaths">Baños Mín.</Label>
          <Input id="minBaths" name="minBaths" type="number" value={filters.minBaths || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="minConstruction">Construcción Mín. (m²)</Label>
          <Input id="minConstruction" name="minConstruction" type="number" value={filters.minConstruction || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="minLand">Terreno Mín. (m²)</Label>
          <Input id="minLand" name="minLand" type="number" value={filters.minLand || ''} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="exactLevels">Niveles</Label>
          <Input id="exactLevels" name="exactLevels" type="number" value={filters.exactLevels || ''} onChange={handleInputChange} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch id="isNew" name="isNew" checked={filters.isNew || false} onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isNew: checked }))} />
          <Label htmlFor="isNew">Solo Propiedades Nuevas</Label>
        </div>
      </div>
      <Button onClick={onFilter}>Filtrar Propiedades</Button>
    </div>
  );
};

export default PropertyFilters;
