import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from '@/lib/supabaseClient';

const PropertyFilters = ({ filters, setFilters, onFilter }) => {
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

  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <PopoverContent className="w-[200px] p-0">
              <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                <CommandInput placeholder="Buscar o crear..." />
                <CommandEmpty>
                   <Button variant="ghost" className="w-full justify-start text-left"
                      onClick={() => {
                        const input = document.querySelector('[cmdk-input]');
                        if (input) handleCreateFraccionamiento(input.value);
                      }}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Crear "{document.querySelector('[cmdk-input]')?.value}"
                    </Button>
                </CommandEmpty>
                <CommandGroup>
                  {fraccionamientos.map((f) => (
                    <CommandItem
                      key={f.id}
                      value={f.nombre}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === f.nombre.toLowerCase() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {f.nombre}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <Button onClick={onFilter}>Filtrar Propiedades</Button>
    </div>
  );
};

export default PropertyFilters;
