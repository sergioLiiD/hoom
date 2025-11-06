import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { Home, Building, MapPin, Users, Loader2 } from 'lucide-react';

const MetricsCards = () => {
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    newHousesApartments: 0,
    usedHousesApartments: 0,
    totalLands: 0,
    totalPromoters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Obtener total de propiedades
        const { count: totalProperties } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true });

        // Obtener casas y departamentos nuevos
        const { count: newHousesApartments } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .in('property_type', ['casa', 'departamento'])
          .eq('is_new_property', true);

        // Obtener casas y departamentos usados
        const { count: usedHousesApartments } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .in('property_type', ['casa', 'departamento'])
          .eq('is_new_property', false);

        // Obtener total de terrenos
        const { count: totalLands } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('property_type', 'terreno');

        // Obtener total de inmobiliarios (promotores)
        const { count: totalPromoters } = await supabase
          .from('promoters')
          .select('*', { count: 'exact', head: true });

        setMetrics({
          totalProperties: totalProperties || 0,
          newHousesApartments: newHousesApartments || 0,
          usedHousesApartments: usedHousesApartments || 0,
          totalLands: totalLands || 0,
          totalPromoters: totalPromoters || 0,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      <Card className="bg-white/80">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Propiedades</p>
              <p className="text-lg font-semibold">{metrics.totalProperties}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/80">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Casas/Deptos. Nuevos</p>
              <p className="text-lg font-semibold">{metrics.newHousesApartments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/80">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Casas/Deptos. Usados</p>
              <p className="text-lg font-semibold">{metrics.usedHousesApartments}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/80">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Terrenos</p>
              <p className="text-lg font-semibold">{metrics.totalLands}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/80">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Inmobiliarios</p>
              <p className="text-lg font-semibold">{metrics.totalPromoters}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsCards;
