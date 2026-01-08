import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from '@/lib/supabaseClient';

const PropertyFilters = ({ filters, setFilters, onFilter, hidePropertyTypeFilter = false, hideListingTypeFilter = false }) => {
  const [fraccionamientos, setFraccionamientos] = useState([]);
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  useEffect(() => {
    const fetchFraccionamientos = async () => {
      const { data, error } = await supabase.from('fraccionamientos').select('id, nombre');
      if (error) {
        console.error('Error fetching fraccionamientos:', error);
      } else {
        setFraccionamientos(data || []);
      }
    };
    fetchFraccionamientos();
  }, []);

  useEffect(() => {
    const selectedFraccionamiento = fraccionamientos.find(f => f.nombre.toLowerCase() === value.toLowerCase());
    setFilters(prev => ({ ...prev, fraccionamiento_id: selectedFraccionamiento ? selectedFraccionamiento.id : undefined }));
  }, [value, fraccionamientos, setFilters]);

  const handleCreateFraccionamiento = async (nombre) => {
    if (!nombre || fraccionamientos.some(f => f.nombre.toLowerCase() === nombre.toLowerCase())) return;
    
    const { data, error } = await supabase
      .from('fraccionamientos')
      .insert([{ nombre }])
      .select();

    if (error) {
      console.error('Error creating fraccionamiento:', error);
    } else if (data) {
      const newFraccionamiento = data[0];
      setFraccionamientos(prev => [...prev, newFraccionamiento]);
      setValue(newFraccionamiento.nombre.toLowerCase());
      setOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Generar opciones de meses
  const meses = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  // Generar opciones de años (últimos 5 años)
  const currentYear = new Date().getFullYear();
  const años = Array.from({ length: 5 }, (_, i) => {
    const año = currentYear - i;
    return { value: año.toString(), label: año.toString() };
  });

  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
        <div>
          <Label htmlFor="fraccionamiento">Fraccionamiento</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {value
                  ? fraccionamientos.find((f) => f.nombre.toLowerCase() === value)?.nombre
                  : "Seleccionar o crear..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                <div className="px-2 pt-2">
                  <CommandInput placeholder="Buscar fraccionamiento..." />
                </div>
                <CommandEmpty className="py-2 px-4 text-sm">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left"
                    onClick={() => {
                      const input = document.querySelector('[cmdk-input]');
                      if (input && input.value) handleCreateFraccionamiento(input.value);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear "{document.querySelector('[cmdk-input]')?.value || 'nuevo'}"
                  </Button>
                </CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {fraccionamientos.map((f) => (
                    <CommandItem
                      key={f.id}
                      value={f.nombre}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue)
                        setOpen(false)
                      }}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 flex-shrink-0",
                          value === f.nombre.toLowerCase() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{f.nombre}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {!hidePropertyTypeFilter && (
          <div>
            <Label htmlFor="propertyType">Tipo de Propiedad</Label>
            <Select
              name="property_type"
              value={filters.property_type || 'all'}
              onValueChange={(value) => setFilters(prev => ({ ...prev, property_type: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="casa">Casa</SelectItem>
                <SelectItem value="terreno">Terreno</SelectItem>
                <SelectItem value="departamento">Departamento</SelectItem>
                <SelectItem value="oficina">Oficina</SelectItem>
                <SelectItem value="local_comercial">Local Comercial</SelectItem>
                <SelectItem value="bodega">Bodega</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {!hideListingTypeFilter && (
          <div>
            <Label htmlFor="listingType">Tipo de Listado</Label>
            <Select
              name="listing_type"
              value={filters.listing_type || 'all'}
              onValueChange={(value) => setFilters(prev => ({ ...prev, listing_type: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="venta">Venta</SelectItem>
                <SelectItem value="renta">Renta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="publicationMonth">Mes de Publicación</Label>
          <Select
            name="publicationMonth"
            value={filters.publicationMonth || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, publicationMonth: value === 'all' ? undefined : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {meses.map((mes) => (
                <SelectItem key={mes.value} value={mes.value}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="publicationYear">Año de Publicación</Label>
          <Select
            name="publicationYear"
            value={filters.publicationYear || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, publicationYear: value === 'all' ? undefined : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los años" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los años</SelectItem>
              {años.map((año) => (
                <SelectItem key={año.value} value={año.value}>
                  {año.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label htmlFor="publicationDateStart">Fecha de Inicio (Publicación)</Label>
          <DatePicker 
            date={filters.publicationDateStart} 
            setDate={(date) => setFilters(prev => ({ ...prev, publicationDateStart: date }))} 
            placeholder="Seleccionar fecha de inicio"
          />
        </div>
        <div>
          <Label htmlFor="publicationDateEnd">Fecha de Fin (Publicación)</Label>
          <DatePicker 
            date={filters.publicationDateEnd} 
            setDate={(date) => setFilters(prev => ({ ...prev, publicationDateEnd: date }))} 
            placeholder="Seleccionar fecha de fin"
          />
        </div>
      </div>
      <Button onClick={onFilter}>Filtrar Propiedades</Button>
    </div>
  );
};

export default PropertyFilters;
