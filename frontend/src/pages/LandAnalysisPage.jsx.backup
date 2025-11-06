import { useState, useEffect } from 'react';
import PropertyFilters from '@/components/PropertyFilters';
import ChatFilter from '@/components/ChatFilter';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import PropertyDetails from '@/components/PropertyDetails';
import { Building2 } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';
import CollapsibleFilters from '@/components/CollapsibleFilters';

const RentalAnalysisPage = () => {
  const [filters, setFilters] = useState({ listing_type: 'renta' }); // Forzar tipo renta
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medianPricePerMonth, setMedianPricePerMonth] = useState(0);
  const [averagePricePerMonth, setAveragePricePerMonth] = useState(0);
  const [minPricePerMonth, setMinPricePerMonth] = useState(0);
  const [maxPricePerMonth, setMaxPricePerMonth] = useState(0);
  const [viewingProperty, setViewingProperty] = useState(null);

  const parsePrompt = (prompt) => {
    const cleanPrompt = prompt.toLowerCase().replace(/,/g, '');
    const newFilters = { listing_type: 'renta' }; // Siempre mantener tipo renta

    const patterns = {
      minPrice: /(?:mas de|minimo|desde) \$?(\d+)/i,
      maxPrice: /(?:menos de|maximo|hasta) \$?(\d+)/i,
      minBeds: /(?:(?:mas de|minimo|desde) )?(\d+|un|una) (?:habitaciones|cuartos|recamaras)/i,
      minBaths: /(?:(?:mas de|minimo|desde) )?(\d+|un|una) (?:baños|banos)/i,
      minConstruction: /(?:(?:mas de|minimo|desde) )?(\d+) m2(?: de construcción)?/i,
      minLand: /(?:(?:mas de|minimo|desde) )?(\d+) m2 de terreno/i,
      exactLevels: /(\d+) niveles?/i,
      isNew: /nuevas?/i,
      propertyType: /(casas?|terrenos?|departamentos?|oficinas?|local(?:es)? comercial(?:es)?|bodegas?)(\s|$)/i,
    };

    const getNumber = (match) => {
      if (!match) return null;
      if (match[1]) return parseInt(match[1]);
      if (match[0].includes('un') || match[0].includes('una')) return 1;
      return null;
    };

    const minPriceMatch = cleanPrompt.match(patterns.minPrice);
    if (minPriceMatch) newFilters.minPrice = parseInt(minPriceMatch[1]);

    const maxPriceMatch = cleanPrompt.match(patterns.maxPrice);
    if (maxPriceMatch) newFilters.maxPrice = parseInt(maxPriceMatch[1]);

    const bedMatch = cleanPrompt.match(patterns.minBeds);
    const minBeds = getNumber(bedMatch);
    if (minBeds) newFilters.minBeds = minBeds;

    const bathMatch = cleanPrompt.match(patterns.minBaths);
    const minBaths = getNumber(bathMatch);
    if (minBaths) newFilters.minBaths = minBaths;

    const constructionMatch = cleanPrompt.match(patterns.minConstruction);
    if (constructionMatch) newFilters.minConstruction = parseInt(constructionMatch[1]);

    const landMatch = cleanPrompt.match(patterns.minLand);
    if (landMatch) newFilters.minLand = parseInt(landMatch[1]);

    const levelsMatch = cleanPrompt.match(patterns.exactLevels);
    if (levelsMatch) newFilters.exactLevels = parseInt(levelsMatch[1]);

    const isNewMatch = cleanPrompt.match(patterns.isNew);
    if (isNewMatch) newFilters.isNew = true;

    // Detectar tipo de propiedad en el prompt
    const propertyTypeMatch = cleanPrompt.match(patterns.propertyType);
    if (propertyTypeMatch) {
      const propertyTypeText = propertyTypeMatch[1].toLowerCase();
      if (propertyTypeText.includes('casa')) {
        newFilters.property_type = 'casa';
      } else if (propertyTypeText.includes('departamento')) {
        newFilters.property_type = 'departamento';
      } else if (propertyTypeText.includes('oficina')) {
        newFilters.property_type = 'oficina';
      } else if (propertyTypeText.includes('local')) {
        newFilters.property_type = 'local_comercial';
      } else if (propertyTypeText.includes('bodega')) {
        newFilters.property_type = 'bodega';
      }
    }

    return newFilters;
  };

  const handlePromptSubmit = (prompt) => {
    const newFilters = parsePrompt(prompt);
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  useEffect(() => {
    const handleFilter = async () => {
      setLoading(true);
      let query = supabase.from('properties')
        .select('*, promoter_id(*), fraccionamientos (nombre)')
        .eq('listing_type', 'renta'); // Siempre filtrar por renta

      if (filters.property_type) query = query.eq('property_type', filters.property_type);
      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.minBeds) query = query.gte('bedrooms', filters.minBeds);
      if (filters.minBaths) query = query.gte('full_bathrooms', filters.minBaths);
      if (filters.minConstruction) query = query.gte('construction_area_m2', filters.minConstruction);
      if (filters.minLand) query = query.gte('land_area_m2', filters.minLand);
      if (filters.exactLevels) query = query.eq('levels', filters.exactLevels);
      if (filters.isNew) query = query.eq('is_new_property', true);
      if (filters.fraccionamiento_id) query = query.eq('fraccionamiento_id', filters.fraccionamiento_id);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data || []);
        if (data && data.length > 0) {
          // Filtrar propiedades que tienen precio definido
          const pricedProperties = data.filter(p => p.price != null && p.price > 0);
          console.log(`Propiedades con precio definido: ${pricedProperties.length} de ${data.length}`);
          
          if (pricedProperties.length > 0) {
            // Extraer y ordenar los precios
            const prices = pricedProperties.map(p => p.price);
            const sortedPrices = [...prices].sort((a, b) => a - b);
            
            // Imprimir los precios para depuración
            console.log('Precios ordenados:', sortedPrices);
            
            // Calcular la mediana
            const mid = Math.floor(sortedPrices.length / 2);
            let median;
            
            if (sortedPrices.length % 2 !== 0) {
              // Número impar de elementos - tomar el elemento central
              median = sortedPrices[mid];
              console.log(`Mediana (impar): índice ${mid} = ${median}`);
            } else {
              // Número par de elementos - promediar los dos elementos centrales
              median = (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
              console.log(`Mediana (par): (${sortedPrices[mid-1]} + ${sortedPrices[mid]}) / 2 = ${median}`);
            }
            
            // Calcular también el promedio para comparar
            const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const minPrice = sortedPrices[0];
            const maxPrice = sortedPrices[sortedPrices.length - 1];
            
            console.log(`Promedio: ${average.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`);
            console.log(`Mediana: ${median.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`);
            console.log(`Mínimo: ${minPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`);
            console.log(`Máximo: ${maxPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`);
            
            setMedianPricePerMonth(median);
            setAveragePricePerMonth(average);
            setMinPricePerMonth(minPrice);
            setMaxPricePerMonth(maxPrice);
          } else {
            console.log('No hay propiedades con precio definido');
            setMedianPricePerMonth(0);
            setAveragePricePerMonth(0);
            setMinPricePerMonth(0);
            setMaxPricePerMonth(0);
          }
        } else {
          console.log('No hay propiedades que cumplan con los filtros');
          setMedianPricePerMonth(0);
          setAveragePricePerMonth(0);
          setMinPricePerMonth(0);
          setMaxPricePerMonth(0);
        }
      }
      setLoading(false);
    };

    handleFilter();
  }, [filters]);

  // Función para obtener el ícono según el tipo de propiedad
  const getPropertyTypeIcon = (propertyType) => {
    switch (propertyType) {
      case 'casa':
        return '🏠';
      case 'departamento':
        return '🏢';
      case 'oficina':
        return '🏢';
      case 'local_comercial':
        return '🏪';
      case 'bodega':
        return '🏭';
      default:
        return '🏠';
    }
  };

  // Función para obtener el nombre del tipo de propiedad
  const getPropertyTypeName = (propertyType) => {
    switch (propertyType) {
      case 'casa':
        return 'Casa';
      case 'departamento':
        return 'Departamento';
      case 'oficina':
        return 'Oficina';
      case 'local_comercial':
        return 'Local Comercial';
      case 'bodega':
        return 'Bodega';
      default:
        return 'Propiedad';
    }
  };

  return (
    <div className="w-full max-w-full px-4 mx-auto">
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-primary">Propiedades en Renta</h1>
          </div>
          <img src={logo} alt="Hoom Properties Logo" className="h-12" />
        </div>
  
        {/* Filtros de Propiedades - Arriba */}
        <CollapsibleFilters title="Filtros de Propiedades" defaultOpen={false} className="w-full">
          <PropertyFilters 
            filters={filters} 
            setFilters={setFilters} 
            onFilter={() => fetchProperties()}
            className="w-full"
            hideListingTypeFilter={true} // Ocultar filtro de tipo de listado
          />
        </CollapsibleFilters>
        
        {/* Búsqueda por Chat - Abajo */}
        <CollapsibleFilters title="Búsqueda por Chat" defaultOpen={false} className="w-full">
          <div className="w-full">
            <ChatFilter 
              onPromptSubmit={handlePromptSubmit} 
              loading={loading}
              className="w-full"
            />
          </div>
        </CollapsibleFilters>
  
        <div className="w-full mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Cargando propiedades...</p>
            </div>
          ) : (
            <div className="mt-4">
              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Propiedades Encontradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{properties.length}</div>
                  </CardContent>
                </Card>
                {/* Rest of your cards... */}
              </div>
              <div className="relative max-h-[600px] overflow-auto">
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="sticky top-0 bg-background">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="w-16">Foto</TableHead>
                        <TableHead className="min-w-[180px]">Título</TableHead>
                        <TableHead className="min-w-[120px]">Promotor</TableHead>
                        <TableHead className="min-w-[150px]">Fracc.</TableHead>
                        <TableHead className="w-20">Portal</TableHead>
                        <TableHead className="w-28">Precio</TableHead>
                        <TableHead className="w-16">Habs.</TableHead>
                        <TableHead className="w-16">Baños</TableHead>
                        <TableHead className="w-20">Cons. (m²)</TableHead>
                        <TableHead className="w-20">Terr. (m²)</TableHead>
                        <TableHead className="w-16">1/2 B</TableHead>
                        <TableHead className="w-16">Niv.</TableHead>
                        <TableHead className="w-20">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((prop, index) => (
                        <TableRow key={prop.id} className="text-sm">
                          <TableCell className="p-2">{index + 1}</TableCell>
                          <TableCell className="p-2">
                            <img 
                              src={prop.photos?.[0] || 'https://via.placeholder.com/100x100.png?text=Sin+Foto'} 
                              alt={prop.title} 
                              className="h-10 w-10 object-cover rounded-md" 
                              referrerPolicy="no-referrer" 
                            />
                          </TableCell>
                          <TableCell className="p-2">{prop.title}</TableCell>
                          <TableCell className="p-2">{prop.promoter_id?.name}</TableCell>
                          <TableCell className="p-2">{prop.fraccionamientos?.nombre}</TableCell>
                          <TableCell className="p-2">{prop.source_portal}</TableCell>
                          <TableCell className="p-2">
                            <div className="whitespace-nowrap">
                              {prop.price ? prop.price.toLocaleString('es-MX', { 
                                style: 'currency', 
                                currency: 'MXN',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }) : 'N/D'}
                            </div>
                            {prop.price && prop.construction_area_m2 > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {(prop.price / prop.construction_area_m2).toLocaleString('es-MX', { 
                                  style: 'currency', 
                                  currency: 'MXN', 
                                  maximumFractionDigits: 0 
                                })}/m²
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="p-2">{prop.bedrooms || '-'}</TableCell>
                          <TableCell className="p-2">{prop.full_bathrooms || '-'}</TableCell>
                          <TableCell className="p-2">{prop.construction_area_m2 || '-'}</TableCell>
                          <TableCell className="p-2">{prop.land_area_m2 || '-'}</TableCell>
                          <TableCell className="p-2">{prop.half_bathrooms || '-'}</TableCell>
                          <TableCell className="p-2">{prop.levels || '-'}</TableCell>
                          <TableCell className="p-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setViewingProperty(prop)}
                              className="text-xs h-8 px-2"
                            >
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      
      {viewingProperty && (
        <Sheet open={!!viewingProperty} onOpenChange={() => setViewingProperty(null)}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{viewingProperty.title}</SheetTitle>
              <SheetDescription>{viewingProperty.location_text}</SheetDescription>
            </SheetHeader>
            <PropertyDetails property={viewingProperty} />
          </SheetContent>
        </Sheet>
      )}
    </div>
  </div>
  );
};

export default RentalAnalysisPage;
