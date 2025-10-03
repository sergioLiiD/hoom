import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/button";
import { ChevronUp, ChevronDown } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';

const MapFilters = ({ filters, onFilterChange, onApplyFilters }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Actualizar localFilters cuando cambian los filtros externos
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  const propertyTypes = [
    { value: 'casa', label: '🏠 Casa' },
    { value: 'terreno', label: '🌳 Terreno' },
    { value: 'departamento', label: '🏢 Departamento' },
    { value: 'oficina', label: '🏢 Oficina' },
    { value: 'local_comercial', label: '🏬 Local Comercial' },
    { value: 'bodega', label: '🏭 Bodega' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newValue = value ? parseFloat(value) : undefined;
    setLocalFilters(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSwitchChange = (checked) => {
    setLocalFilters(prev => ({ ...prev, isNew: checked }));
  };
  
  const handlePropertyTypeChange = (value) => {
    console.log(`Select value changed to: ${value}`);
    const newValue = value === 'all' ? undefined : value;
    console.log(`Setting property_type to: ${newValue}`);
    
    setLocalFilters(prev => ({ ...prev, property_type: newValue }));
  };
  
  const applyLocalFilters = () => {
    console.log('Applying local filters:', localFilters);
    onFilterChange(localFilters);
    onApplyFilters();
  };

  return (
    <Card className="absolute top-4 left-4 z-[1000] w-80 bg-white/90 backdrop-blur-sm">
      <CardHeader className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Hoom Logo" className="h-8" />
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minPrice">Precio Mín.</Label>
            <Input id="minPrice" name="minPrice" type="number" value={localFilters.minPrice || ''} onChange={handleInputChange} placeholder="$1M" />
          </div>
          <div>
            <Label htmlFor="maxPrice">Precio Máx.</Label>
            <Input id="maxPrice" name="maxPrice" type="number" value={localFilters.maxPrice || ''} onChange={handleInputChange} placeholder="$5M" />
          </div>
          <div>
            <Label htmlFor="minConstruction">Const. Mín. (m²)</Label>
            <Input id="minConstruction" name="minConstruction" type="number" value={localFilters.minConstruction || ''} onChange={handleInputChange} placeholder="100" />
          </div>
          <div>
            <Label htmlFor="maxConstruction">Const. Máx. (m²)</Label>
            <Input id="maxConstruction" name="maxConstruction" type="number" value={localFilters.maxConstruction || ''} onChange={handleInputChange} placeholder="500" />
          </div>
          <div>
            <Label htmlFor="minLand">Terreno Mín. (m²)</Label>
            <Input id="minLand" name="minLand" type="number" value={localFilters.minLand || ''} onChange={handleInputChange} placeholder="120" />
          </div>
          <div>
            <Label htmlFor="maxLand">Terreno Máx. (m²)</Label>
            <Input id="maxLand" name="maxLand" type="number" value={localFilters.maxLand || ''} onChange={handleInputChange} placeholder="1000" />
          </div>
        </div>
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="propertyType">Tipo de Propiedad</Label>
            <select
              name="propertyType"
              id="propertyType"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={localFilters.property_type || 'all'}
              onChange={(e) => handlePropertyTypeChange(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              {propertyTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch id="isNew" checked={localFilters.isNew || false} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="isNew">Solo Propiedades Nuevas</Label>
          </div>
        </div>
        <Button onClick={applyLocalFilters} className="w-full">Aplicar Filtros</Button>
        </CardContent>
      )} 
    </Card>
  );
};

export default MapFilters;
