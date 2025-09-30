import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "./ui/button";
import { ChevronUp, ChevronDown } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';

const MapFilters = ({ filters, onFilterChange, onApplyFilters }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
  };

  const handleSwitchChange = (checked) => {
    onFilterChange(prev => ({ ...prev, isNew: checked }));
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
            <Input id="minPrice" name="minPrice" type="number" value={filters.minPrice || ''} onChange={handleInputChange} placeholder="$1M" />
          </div>
          <div>
            <Label htmlFor="maxPrice">Precio Máx.</Label>
            <Input id="maxPrice" name="maxPrice" type="number" value={filters.maxPrice || ''} onChange={handleInputChange} placeholder="$5M" />
          </div>
          <div>
            <Label htmlFor="minConstruction">Const. Mín. (m²)</Label>
            <Input id="minConstruction" name="minConstruction" type="number" value={filters.minConstruction || ''} onChange={handleInputChange} placeholder="100" />
          </div>
          <div>
            <Label htmlFor="maxConstruction">Const. Máx. (m²)</Label>
            <Input id="maxConstruction" name="maxConstruction" type="number" value={filters.maxConstruction || ''} onChange={handleInputChange} placeholder="500" />
          </div>
          <div>
            <Label htmlFor="minLand">Terreno Mín. (m²)</Label>
            <Input id="minLand" name="minLand" type="number" value={filters.minLand || ''} onChange={handleInputChange} placeholder="120" />
          </div>
          <div>
            <Label htmlFor="maxLand">Terreno Máx. (m²)</Label>
            <Input id="maxLand" name="maxLand" type="number" value={filters.maxLand || ''} onChange={handleInputChange} placeholder="1000" />
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Switch id="isNew" checked={filters.isNew || false} onCheckedChange={handleSwitchChange} />
          <Label htmlFor="isNew">Solo Propiedades Nuevas</Label>
        </div>
        <Button onClick={onApplyFilters} className="w-full">Aplicar Filtros</Button>
        </CardContent>
      )} 
    </Card>
  );
};

export default MapFilters;
