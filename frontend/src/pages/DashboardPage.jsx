import { useState, useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropertyList from "@/components/PropertyList";
import Filters from "@/components/Filters";
import { supabase } from "@/lib/supabaseClient";
import logo from '@/assets/logo-hoom.png';

export default function DashboardPage() {
  const [view, setView] = useState('grid');
  const [properties, setProperties] = useState([]);
  const [promoters, setPromoters] = useState([]);
  const [fraccionamientos, setFraccionamientos] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [filters, setFilters] = useState({
    portal: 'all',
    promoter: 'all',
    minPrice: '',
    maxPrice: '',
    startDate: null,
    endDate: null,
  });

  const fetchData = async () => {
    const { data: propertiesData, error: propertiesError } = await supabase.from('properties').select('*, promoter_id(*), fraccionamientos(nombre)');
    if (propertiesError) console.error('Error fetching properties:', propertiesError);
    else setProperties(propertiesData || []);

    const { data: promotersData, error: promotersError } = await supabase.from('promoters').select('*');
    if (promotersError) console.error('Error fetching promoters:', promotersError);
    else setPromoters(promotersData || []);

    const { data: fraccionamientosData, error: fraccionamientosError } = await supabase.from('fraccionamientos').select('*');
    if (fraccionamientosError) console.error('Error fetching fraccionamientos:', fraccionamientosError);
    else setFraccionamientos(fraccionamientosData || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = properties;

    if (filters.portal !== 'all') {
      result = result.filter(p => p.source_portal === filters.portal);
    }

    if (filters.promoter !== 'all') {
      result = result.filter(p => p.promoter_id?.id === parseInt(filters.promoter));
    }

    if (filters.minPrice) {
      result = result.filter(p => p.price >= filters.minPrice);
    }

    if (filters.maxPrice) {
      result = result.filter(p => p.price <= filters.maxPrice);
    }

    if (filters.startDate) {
      result = result.filter(p => new Date(p.created_at) >= filters.startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include the whole day
      result = result.filter(p => new Date(p.created_at) <= endDate);
    }

    setFilteredProperties(result);
  }, [filters, properties]);

  const portals = [...new Set(properties.map(p => p.source_portal))];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <img src={logo} alt="Hoom Properties Logo" className="h-12" />
        <div className="flex items-center gap-2">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="sticky top-0 z-10 bg-background py-4">
        <Filters filters={filters} setFilters={setFilters} portals={portals} promoters={promoters} />
      </div>
      <PropertyList properties={filteredProperties} promoters={promoters} fraccionamientos={fraccionamientos} onDataChange={fetchData} view={view} />
    </>
  )
}
