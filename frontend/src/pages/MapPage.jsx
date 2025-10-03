import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Home, Trees, Building2, Building, Store, Warehouse } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import MapFilters from '@/components/MapFilters';
import PropertyCard from '@/components/PropertyCard';
import PropertyDetails from '@/components/PropertyDetails';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Crear iconos personalizados para cada tipo de propiedad
const createPropertyIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

// Definir iconos para cada tipo de propiedad
const propertyIcons = {
  casa: createPropertyIcon('#3b82f6'), // Azul
  terreno: createPropertyIcon('#22c55e'), // Verde
  departamento: createPropertyIcon('#a855f7'), // Morado
  oficina: createPropertyIcon('#64748b'), // Gris
  local_comercial: createPropertyIcon('#f59e0b'), // Ámbar
  bodega: createPropertyIcon('#f97316'), // Naranja
  default: createPropertyIcon('#ef4444') // Rojo para tipos desconocidos
};

const MapPage = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [viewingProperty, setViewingProperty] = useState(null);

  const applyFilters = useCallback(() => {
    console.log('Applying filters:', filters);
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
      filtered = filtered.filter(p => p.is_new_property === true);
    }
    
    // Filtrar por tipo de propiedad
    if (filters.property_type) {
      console.log(`Filtering by property_type: ${filters.property_type}`);
      
      // Verificar cuántas propiedades tienen este tipo antes del filtro
      const propertiesWithThisType = filtered.filter(p => p.property_type === filters.property_type);
      console.log(`Properties with type '${filters.property_type}' before filtering: ${propertiesWithThisType.length}`);
      
      // Aplicar el filtro con más información de depuración
      filtered = filtered.filter(p => {
        // Si la propiedad no tiene tipo, mostrar advertencia
        if (!p.property_type) {
          console.log(`Property ${p.id} has no property_type`);
          return false;
        }
        
        const match = p.property_type === filters.property_type;
        if (!match) {
          console.log(`Property ${p.id}: '${p.property_type}' !== '${filters.property_type}'`);
        }
        return match;
      });
      
      console.log(`After filtering by type '${filters.property_type}': ${filtered.length} properties remain`);
    }

    console.log(`Filtered from ${allProperties.length} to ${filtered.length} properties`);
    setFilteredProperties(filtered);
  }, [allProperties, filters]);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, fraccionamientos (nombre)');

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        console.log('Fetched properties:', data);
        // Verificar los tipos de propiedad disponibles
        const propertyTypes = [...new Set(data.map(p => p.property_type))];
        console.log('Property types in data:', propertyTypes);
        
        // Verificar si hay propiedades sin tipo
        const withoutType = data.filter(p => !p.property_type);
        if (withoutType.length > 0) {
          console.log(`${withoutType.length} properties without type:`, withoutType);
        }
        
        setAllProperties(data);
        setFilteredProperties(data);
      }
    };

    fetchProperties();
  }, []);
  
  // Aplicar filtros automáticamente cuando cambian
  useEffect(() => {
    if (allProperties.length > 0) {
      console.log('Filters changed, applying automatically');
      console.log('Current filters:', JSON.stringify(filters));
      applyFilters();
    }
  }, [filters, applyFilters, allProperties]);

  // Obtener el ícono correspondiente al tipo de propiedad seleccionado
  const getPropertyTypeIcon = () => {
    if (!filters.property_type) return null;
    
    switch(filters.property_type) {
      case 'casa': return <Home className="h-5 w-5 text-blue-600" />;
      case 'terreno': return <Trees className="h-5 w-5 text-green-600" />;
      case 'departamento': return <Building2 className="h-5 w-5 text-purple-600" />;
      case 'oficina': return <Building className="h-5 w-5 text-gray-600" />;
      case 'local_comercial': return <Store className="h-5 w-5 text-amber-600" />;
      case 'bodega': return <Warehouse className="h-5 w-5 text-orange-600" />;
      default: return null;
    }
  };

  // Función para depurar el estado actual
  const debugState = () => {
    console.log('=== DEBUG STATE ===');
    console.log('Current filters:', filters);
    console.log('All properties:', allProperties.length);
    console.log('Filtered properties:', filteredProperties.length);
    console.log('Property types in data:', [...new Set(allProperties.map(p => p.property_type))]);
    
    // Verificar cuántas propiedades hay de cada tipo
    const typeCount = {};
    allProperties.forEach(p => {
      const type = p.property_type || 'undefined';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    console.log('Count by property type:', typeCount);
    console.log('===================');
  };

  // Definir la leyenda del mapa
  const mapLegend = [
    { type: 'casa', label: 'Casas', color: '#3b82f6', icon: <Home className="h-4 w-4 text-blue-600" /> },
    { type: 'terreno', label: 'Terrenos', color: '#22c55e', icon: <Trees className="h-4 w-4 text-green-600" /> },
    { type: 'departamento', label: 'Departamentos', color: '#a855f7', icon: <Building2 className="h-4 w-4 text-purple-600" /> },
    { type: 'oficina', label: 'Oficinas', color: '#64748b', icon: <Building className="h-4 w-4 text-gray-600" /> },
    { type: 'local_comercial', label: 'Locales Comerciales', color: '#f59e0b', icon: <Store className="h-4 w-4 text-amber-600" /> },
    { type: 'bodega', label: 'Bodegas', color: '#f97316', icon: <Warehouse className="h-4 w-4 text-orange-600" /> },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] relative">
      {/* Botón de depuración - Solo visible en desarrollo */}
      <button 
        onClick={debugState}
        className="absolute top-4 right-4 z-[1001] bg-red-500 text-white px-2 py-1 text-xs rounded"
      >
        Debug
      </button>
      
      {/* Leyenda del mapa */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-md shadow max-w-xs">
        <h3 className="text-sm font-semibold mb-2">Tipos de Propiedad</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {mapLegend.map(item => (
            <div key={item.type} className="flex items-center gap-2 text-xs">
              <div style={{ backgroundColor: item.color }} className="w-3 h-3 rounded-full border border-white shadow-sm"></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {filters.property_type && (
        <div className="absolute top-4 right-20 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow flex items-center gap-2">
          {getPropertyTypeIcon()}
          <span className="font-medium">
            Mostrando: {filters.property_type === 'casa' ? 'Casas' : 
                        filters.property_type === 'terreno' ? 'Terrenos' : 
                        filters.property_type === 'departamento' ? 'Departamentos' : 
                        filters.property_type === 'oficina' ? 'Oficinas' : 
                        filters.property_type === 'local_comercial' ? 'Locales Comerciales' : 
                        filters.property_type === 'bodega' ? 'Bodegas' : ''}
          </span>
        </div>
      )}
      <MapFilters filters={filters} onFilterChange={setFilters} onApplyFilters={applyFilters} />
      <MapContainer center={[20.1276, -98.7325]} zoom={13} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredProperties.map(property => (
          property.latitude && property.longitude && (
            <Marker 
              key={property.id} 
              position={[property.latitude, property.longitude]}
              icon={propertyIcons[property.property_type] || propertyIcons.default}
            >
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
