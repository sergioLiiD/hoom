import { useState, useEffect } from 'react';
import PropertyFilters from '@/components/PropertyFilters';
import ChatFilter from '@/components/ChatFilter';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import PropertyDetails from '@/components/PropertyDetails';

const AnalysisPage = () => {
  const [filters, setFilters] = useState({});
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avgPrice, setAvgPrice] = useState(0);
  const [avgPricePerSqm, setAvgPricePerSqm] = useState(0);
  const [viewingProperty, setViewingProperty] = useState(null);

  const parsePrompt = (prompt) => {
    const newFilters = {};
    const cleanPrompt = prompt.toLowerCase().replace(/,/g, '');

    const patterns = {
      minPrice: /(?:mas de|minimo|desde) \$?(\d+)/i,
      maxPrice: /(?:menos de|maximo|hasta) \$?(\d+)/i,
      minBeds: /(?:(?:mas de|minimo|desde) )?(?:(\d+)|un|una) (?:habitaciones|cuartos|recamaras)/i,
      minBaths: /(?:(?:mas de|minimo|desde) )?(?:(\d+)|un|una) (?:baños|banos)/i,
      minConstruction: /(?:(?:mas de|minimo|desde) )?(\d+) m2(?: de construcción)?/i,
      minLand: /(?:(?:mas de|minimo|desde) )?(\d+) m2 de terreno/i,
      exactLevels: /(\d+) niveles?/i,
      isNew: /nuevas?/i,
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

    return newFilters;
  };

  const handlePromptSubmit = (prompt) => {
    const newFilters = parsePrompt(prompt);
    setFilters(newFilters);
  };

  useEffect(() => {
    const handleFilter = async () => {
      setLoading(true);
      let query = supabase.from('properties').select('*');

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.minBeds) query = query.gte('bedrooms', filters.minBeds);
      if (filters.minBaths) query = query.gte('full_bathrooms', filters.minBaths);
      if (filters.minConstruction) query = query.gte('construction_area_m2', filters.minConstruction);
      if (filters.minLand) query = query.gte('land_area_m2', filters.minLand);
      if (filters.exactLevels) query = query.eq('levels', filters.exactLevels);
      if (filters.isNew) query = query.eq('is_new_property', true);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data || []);
        if (data && data.length > 0) {
          const pricedProperties = data.filter(p => p.price != null);
          if (pricedProperties.length > 0) {
            const total = pricedProperties.reduce((acc, p) => acc + p.price, 0);
            setAvgPrice(total / pricedProperties.length);

            const propertiesWithSqm = pricedProperties.filter(p => p.construction_area_m2 > 0);
            if (propertiesWithSqm.length > 0) {
              const totalSqmPrice = propertiesWithSqm.reduce((acc, p) => acc + (p.price / p.construction_area_m2), 0);
              setAvgPricePerSqm(totalSqmPrice / propertiesWithSqm.length);
            } else {
              setAvgPricePerSqm(0);
            }
          } else {
            setAvgPrice(0);
            setAvgPricePerSqm(0);
          }
        } else {
          setAvgPrice(0);
        }
      }
      setLoading(false);
    };

    handleFilter();
  }, [filters]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Análisis de Mercado</h1>
      <ChatFilter onPromptSubmit={handlePromptSubmit} />
      <PropertyFilters filters={filters} setFilters={setFilters} onFilter={() => { /* Filtering is now automatic on filter change */ }} />

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Propiedades Encontradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{properties.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Promedio por m²</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgPricePerSqm.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Habitaciones</TableHead>
                    <TableHead>Baños</TableHead>
                    <TableHead>Construcción (m²)</TableHead>
                    <TableHead>Terreno (m²)</TableHead>
                    <TableHead>1/2 Baños</TableHead>
                    <TableHead>Niveles</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map(prop => (
                    <TableRow key={prop.id}>
                      <TableCell>
                        <img src={prop.photos?.[0] || 'https://via.placeholder.com/100x100.png?text=Sin+Foto'} alt={prop.title} className="h-12 w-12 object-cover rounded-md" referrerPolicy="no-referrer" />
                      </TableCell>
                      <TableCell>{prop.title}</TableCell>
                      <TableCell>
                        <div>{prop.price ? prop.price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : 'No disponible'}</div>
                        {prop.price && prop.construction_area_m2 > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ({(prop.price / prop.construction_area_m2).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })}/m²)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{prop.bedrooms}</TableCell>
                      <TableCell>{prop.full_bathrooms}</TableCell>
                      <TableCell>{prop.construction_area_m2}</TableCell>
                      <TableCell>{prop.land_area_m2}</TableCell>
                      <TableCell>{prop.half_bathrooms}</TableCell>
                      <TableCell>{prop.levels}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setViewingProperty(prop)}>Ver Detalles</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

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
  );
};

export default AnalysisPage;


