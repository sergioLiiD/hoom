import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "./ui/button";
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

const FilterGroup = ({ title, children, className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
    {children}
  </div>
);

export default function Filters({ filters, setFilters, portals = [], promoters = [] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Inicializar listing_type en 'all' si no existe
  useEffect(() => {
    if (filters.listing_type === undefined) {
      setFilters(prev => ({ ...prev, listing_type: 'all' }));
    }
  }, [filters.listing_type, setFilters]);

  const propertyTypes = [
    { value: 'casa', label: '🏠 Casa' },
    { value: 'terreno', label: '🌳 Terreno' },
    { value: 'departamento', label: '🏢 Departamento' },
    { value: 'oficina', label: '🏢 Oficina' },
    { value: 'local_comercial', label: '🏬 Local Comercial' },
    { value: 'bodega', label: '🏭 Bodega' },
  ];
  
  const listingTypes = [
    { value: 'venta', label: '💰 Venta' },
    { value: 'renta', label: '📝 Renta' },
  ];
  
  const sortOptions = [
    { value: 'created_at_desc', label: 'Fecha de captura (más reciente)' },
    { value: 'created_at_asc', label: 'Fecha de captura (más antigua)' },
    { value: 'price_desc', label: 'Precio (mayor a menor)' },
    { value: 'price_asc', label: 'Precio (menor a mayor)' },
    { value: 'days_on_market_desc', label: 'Días en mercado (más días)' },
    { value: 'days_on_market_asc', label: 'Días en mercado (menos días)' },
  ];
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderFilterContent = () => (
    <div className="space-y-3 p-1">
      <FilterGroup title="Rango de Precios">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Mínimo"
            value={filters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
          />
          <Input
            type="number"
            placeholder="Máximo"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Fechas">
        <div className="grid grid-cols-2 gap-2">
          <DatePicker 
            date={filters.startDate} 
            setDate={(date) => handleFilterChange('startDate', date)} 
            placeholder="Inicio"
          />
          <DatePicker 
            date={filters.endDate} 
            setDate={(date) => handleFilterChange('endDate', date)} 
            placeholder="Fin"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Tipo de Propiedad">
        <Select 
          onValueChange={(value) => handleFilterChange('property_type', value === 'all' ? undefined : value)}
          value={filters.property_type || 'all'}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {propertyTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Tipo de Listado">
        <Select 
          onValueChange={(value) => handleFilterChange('listing_type', value === 'all' ? undefined : value)}
          value={filters.listing_type || 'all'}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar listado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los listados</SelectItem>
            {listingTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Ordenar por">
        <Select 
          onValueChange={(value) => handleFilterChange('sortBy', value)}
          value={filters.sortBy || 'created_at_desc'}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              size="icon" 
              className="h-12 w-12 rounded-full shadow-lg"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                <DialogTitle>Filtros</DialogTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <ScrollArea className="flex-1 p-4">
              {renderFilterContent()}
            </ScrollArea>
            <div className="p-4 border-t">
              <Button className="w-full" onClick={() => setOpen(false)}>
                Aplicar Filtros
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista de escritorio
  return (
    <div className="border rounded-lg bg-card overflow-hidden text-sm">
      <div className="p-2 border-b flex justify-between items-center">
        <h3 className="font-medium flex items-center gap-1 text-sm">
          <Filter className="h-3 w-3" /> Filtros
        </h3>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isCollapsed ? 'Mostrar filtros' : 'Ocultar filtros'}
        >
          {isCollapsed ? 'Mostrar ▼' : 'Ocultar ▲'}
        </button>
      </div>
      {!isCollapsed && (
        <div className="p-2">
          {renderFilterContent()}
        </div>
      )}
    </div>
  );
}