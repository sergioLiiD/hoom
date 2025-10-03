import { useState, useEffect } from 'react';
import PropertyFilters from '@/components/PropertyFilters';
import ChatFilter from '@/components/ChatFilter';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import PropertyDetails from '@/components/PropertyDetails';
import { Trees } from 'lucide-react';
import logo from '@/assets/logo-hoom.png';

const LandAnalysisPage = () => {
  const [filters, setFilters] = useState({ property_type: 'terreno' }); // Forzar tipo terreno
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medianPricePerSqm, setMedianPricePerSqm] = useState(0);
  const [medianPrice, setMedianPrice] = useState(0);
  const [viewingProperty, setViewingProperty] = useState(null);

  const parsePrompt = (prompt) => {
    const cleanPrompt = prompt.toLowerCase().replace(/,/g, '');
    const newFilters = { property_type: 'terreno' }; // Siempre mantener tipo terreno

    const patterns = {
      minPrice: /(?:mas de|minimo|desde) \$?(\d+)/i,
      maxPrice: /(?:menos de|maximo|hasta) \$?(\d+)/i,
      minLand: /(?:(?:mas de|minimo|desde) )?(\d+) m2/i,
      maxLand: /(?:(?:menos de|maximo|hasta) )?(\d+) m2/i,
    };

    const minPriceMatch = cleanPrompt.match(patterns.minPrice);
    if (minPriceMatch) newFilters.minPrice = parseInt(minPriceMatch[1]);

    const maxPriceMatch = cleanPrompt.match(patterns.maxPrice);
    if (maxPriceMatch) newFilters.maxPrice = parseInt(maxPriceMatch[1]);

    const minLandMatch = cleanPrompt.match(patterns.minLand);
    if (minLandMatch) newFilters.minLand = parseInt(minLandMatch[1]);

    const maxLandMatch = cleanPrompt.match(patterns.maxLand);
    if (maxLandMatch) newFilters.maxLand = parseInt(maxLandMatch[1]);

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
        .eq('property_type', 'terreno'); // Siempre filtrar por terrenos

      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.minLand) query = query.gte('land_area_m2', filters.minLand);
      if (filters.maxLand) query = query.lte('land_area_m2', filters.maxLand);
      if (filters.fraccionamiento_id) query = query.eq('fraccionamiento_id', filters.fraccionamiento_id);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data || []);
        if (data && data.length > 0) {
          const pricedProperties = data.filter(p => p.price != null);
          if (pricedProperties.length > 0) {
            // Calcular precio mediano
            const sortedPrices = pricedProperties.map(p => p.price).sort((a, b) => a - b);
            const mid = Math.floor(sortedPrices.length / 2);
            const median = sortedPrices.length % 2 !== 0 ? sortedPrices[mid] : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
            setMedianPrice(median);

            // Calcular precio por m² para terrenos (usando land_area_m2)
            const propertiesWithSqm = pricedProperties.filter(p => p.land_area_m2 > 0);
            if (propertiesWithSqm.length > 0) {
              const pricesPerSqm = propertiesWithSqm.map(p => p.price / p.land_area_m2).sort((a, b) => a - b);
              const midSqm = Math.floor(pricesPerSqm.length / 2);
              const medianSqm = pricesPerSqm.length % 2 !== 0 ? pricesPerSqm[midSqm] : (pricesPerSqm[midSqm - 1] + pricesPerSqm[midSqm]) / 2;
              setMedianPricePerSqm(medianSqm);
            } else {
              setMedianPricePerSqm(0);
            }
          } else {
            setMedianPrice(0);
            setMedianPricePerSqm(0);
          }
        } else {
          setMedianPrice(0);
          setMedianPricePerSqm(0);
        }
      }
      setLoading(false);
    };

    handleFilter();
  }, [filters]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <img src={logo} alt="Hoom Properties Logo" className="h-12" />
        <div className="flex items-center gap-2">
          <Trees className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-primary">Análisis de Terrenos</h1>
        </div>
      </div>
      
      <ChatFilter onPromptSubmit={handlePromptSubmit} />
      <PropertyFilters 
        filters={filters} 
        setFilters={setFilters} 
        onFilter={() => {}} 
        hidePropertyTypeFilter={true} // Ocultar filtro de tipo de propiedad
      />

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="mt-4">
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terrenos Encontrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{properties.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Precio Mediano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{medianPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Mediano por m²</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{medianPricePerSqm.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0">
                      <TableHead className="bg-background">#</TableHead>
                      <TableHead className="bg-background">Foto</TableHead>
                      <TableHead className="bg-background">Título</TableHead>
                      <TableHead className="bg-background">Promotor</TableHead>
                      <TableHead className="bg-background">Fraccionamiento</TableHead>
                      <TableHead className="bg-background">Portal</TableHead>
                      <TableHead className="bg-background">Precio</TableHead>
                      <TableHead className="bg-background">Terreno (m²)</TableHead>
                      <TableHead className="bg-background">Precio/m²</TableHead>
                      <TableHead className="bg-background">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((prop, index) => (
                      <TableRow key={prop.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <img src={prop.photos?.[0] || 'https://via.placeholder.com/100x100.png?text=Sin+Foto'} alt={prop.title} className="h-12 w-12 object-cover rounded-md" referrerPolicy="no-referrer" />
                        </TableCell>
                        <TableCell>{prop.title}</TableCell>
                        <TableCell>{prop.promoter_id?.name}</TableCell>
                        <TableCell>{prop.fraccionamientos?.nombre}</TableCell>
                        <TableCell>{prop.source_portal}</TableCell>
                        <TableCell>
                          <div>{prop.price ? prop.price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : 'No disponible'}</div>
                        </TableCell>
                        <TableCell>{prop.land_area_m2}</TableCell>
                        <TableCell>
                          {prop.price && prop.land_area_m2 > 0 ? 
                            (prop.price / prop.land_area_m2).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setViewingProperty(prop)}>Ver Detalles</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
            {viewingProperty && <PropertyDetails property={viewingProperty} />}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default LandAnalysisPage;
