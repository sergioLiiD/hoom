import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/supabaseClient';
import MapFilters from '@/components/MapFilters';
import PropertyCard from '@/components/PropertyCard';
import PropertyDetails from '@/components/PropertyDetails';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapPage = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [viewingProperty, setViewingProperty] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, fraccionamientos (nombre)');

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setAllProperties(data);
        setFilteredProperties(data);
      }
    };

    fetchProperties();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = allProperties;

    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= filters.minPrice);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice);
    }
    if (filters.minConstruction) {
      filtered = filtered.filter(p => p.construction_area_m2 >= filters.minConstruction);
    }
    if (filters.maxConstruction) {
      filtered = filtered.filter(p => p.construction_area_m2 <= filters.maxConstruction);
    }
    if (filters.minLand) {
      filtered = filtered.filter(p => p.land_area_m2 >= filters.minLand);
    }
    if (filters.maxLand) {
      filtered = filtered.filter(p => p.land_area_m2 <= filters.maxLand);
    }
    if (filters.isNew) {
      filtered = filtered.filter(p => p.is_new === true);
    }

    setFilteredProperties(filtered);
  }, [allProperties, filters]);

  return (
    <div className="h-[calc(100vh-4rem)] relative">
      <MapFilters filters={filters} onFilterChange={setFilters} onApplyFilters={applyFilters} />
      <MapContainer center={[20.1276, -98.7325]} zoom={13} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredProperties.map(property => (
          property.latitude && property.longitude && (
            <Marker key={property.id} position={[property.latitude, property.longitude]}>
              <Popup closeButton={false}>
                <PropertyCard property={property} onDetailsClick={setViewingProperty} />
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
      <Dialog open={!!viewingProperty} onOpenChange={() => setViewingProperty(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
          {viewingProperty && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingProperty.title}</DialogTitle>
                <DialogDescription>{viewingProperty.location_text}</DialogDescription>
              </DialogHeader>
              <PropertyDetails property={viewingProperty} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapPage;
