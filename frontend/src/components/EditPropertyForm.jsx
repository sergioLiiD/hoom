import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DialogFooter } from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createPropertyIcon, propertyColors } from '@/lib/mapIcons';

export default function EditPropertyForm({ property, promoters, fraccionamientos, onSave, onCancel }) {
  const [formData, setFormData] = useState({ 
    ...property, 
    latitude: property.latitude || 19.4326, 
    longitude: property.longitude || -99.1332,
    property_type: property.property_type || 'casa'
  });
  
  // Definir tipos de propiedades disponibles
  const propertyTypes = [
    { value: 'casa', label: '🏠 Casa' },
    { value: 'terreno', label: '🌳 Terreno' },
    { value: 'departamento', label: '🏢 Departamento' },
    { value: 'oficina', label: '🏢 Oficina' },
    { value: 'local_comercial', label: '🏬 Local Comercial' },
    { value: 'bodega', label: '🏭 Bodega' },
  ];
  
  // Definir tipos de listado disponibles
  const listingTypes = [
    { value: 'venta', label: '💰 Venta' },
    { value: 'renta', label: '📝 Renta' },
  ];

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    // Crear ícono personalizado basado en el tipo de propiedad y listado
    const getCustomIcon = () => {
      const propertyType = formData.property_type || 'default';
      const listingType = formData.listing_type || 'venta';
      const color = propertyColors[propertyType] || propertyColors.default;
      const isRental = listingType === 'renta';
      
      // Crear un ícono personalizado similar al del mapa principal
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${isRental ? 'rgba(255, 255, 255, 0.3)' : color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid ${isRental ? color : 'white'};
            ${isRental ? 'border-style: dashed;' : ''}
            box-shadow: 0 0 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              background-color: ${color};
              width: 16px;
              height: 16px;
              border-radius: 50%;
              border: 2px solid white;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });
      
      return icon;
    };

    return formData.latitude && formData.longitude ? (
      <Marker 
        position={[formData.latitude, formData.longitude]}
        icon={getCustomIcon()}
      />
    ) : null;
  }

  function MapViewUpdater() {
    const map = useMap();
    useEffect(() => {
      map.setView([formData.latitude, formData.longitude], map.getZoom());
    }, [formData.latitude, formData.longitude]);
    return null;
  }

  const [mapSearch, setMapSearch] = useState('');
  const [daysOnMarket, setDaysOnMarket] = useState('');

  useEffect(() => {
    // Si ya tenemos days_on_market guardado, usamos ese valor
    if (property.days_on_market) {
      setDaysOnMarket(property.days_on_market);
    }
    // Si no tenemos days_on_market pero sí tenemos publication_date, calculamos los días
    else if (property.publication_date) {
      const pubDate = new Date(property.publication_date);
      const today = new Date();
      const diffTime = Math.abs(today - pubDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysOnMarket(diffDays);
      // Actualizamos formData con el valor calculado
      setFormData(prev => ({ ...prev, days_on_market: diffDays }));
    }
  }, [property.publication_date, property.days_on_market]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDaysChange = (days) => {
    setDaysOnMarket(days);
    if (days && !isNaN(days)) {
      const newPubDate = new Date();
      newPubDate.setDate(newPubDate.getDate() - parseInt(days, 10));
      handleChange('publication_date', newPubDate.toISOString().split('T')[0]);
      // Guardar también los días en el mercado
      handleChange('days_on_market', parseInt(days, 10));
    }
  };

  const handleMapSearch = async () => {
    if (!mapSearch) return;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearch)}&format=json&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      setFormData(prev => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lon) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare data for Supabase, ensuring promoter_id is an integer
    const preparedData = {
      ...formData,
      promoter_id: formData.promoter_id?.id || formData.promoter_id,
      fraccionamiento_id: formData.fraccionamiento_id?.id || formData.fraccionamiento_id,
    };

    // Remove nested objects if they exist
    delete preparedData.promoter;
    delete preparedData.fraccionamientos;
    
    // Asegurarse de que days_on_market sea un número entero o null
    if (preparedData.days_on_market) {
      preparedData.days_on_market = parseInt(preparedData.days_on_market, 10) || null;
    }
    
    try {
      const { error } = await supabase
        .from('properties')
        .update(preparedData)
        .eq('id', property.id);
  
      if (error) {
        console.error('Error updating property:', error);
        
        // Si el error es por la columna days_on_market, intentamos de nuevo sin ese campo
        if (error.message && error.message.includes('days_on_market')) {
          console.log('Retrying without days_on_market field');
          delete preparedData.days_on_market;
          
          const { error: retryError } = await supabase
            .from('properties')
            .update(preparedData)
            .eq('id', property.id);
            
          if (retryError) {
            console.error('Error in retry update:', retryError);
          } else {
            onSave(preparedData);
            return;
          }
        }
      } else {
        onSave(preparedData);
        return;
      }
    } catch (err) {
      console.error('Exception during update:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div className="space-y-2 col-span-1">
          <Label>Tipo de Propiedad</Label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => handleChange('property_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo de propiedad" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 col-span-1">
          <Label>Tipo de Listado</Label>
          <Select
            value={formData.listing_type || 'venta'}
            onValueChange={(value) => handleChange('listing_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo de listado" />
            </SelectTrigger>
            <SelectContent>
              {listingTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={formData.title || ''} onChange={(e) => handleChange('title', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input id="price" type="number" value={formData.price || ''} onChange={(e) => handleChange('price', parseFloat(e.target.value))} />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="location_text">Ubicación</Label>
          <Input id="location_text" value={formData.location_text || ''} onChange={(e) => handleChange('location_text', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Promotor</Label>
          <Select onValueChange={(value) => handleChange('promoter_id', parseInt(value))} value={formData.promoter_id?.id || formData.promoter_id}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar Promotor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Sin Promotor</SelectItem>
              {promoters.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fraccionamiento</Label>
          <Select onValueChange={(value) => handleChange('fraccionamiento_id', value)} value={formData.fraccionamiento_id?.id || formData.fraccionamiento_id}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar Fraccionamiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Sin Fraccionamiento</SelectItem>
              {fraccionamientos.map(f => <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {/* Área de terreno (siempre visible) */}
        <div className="space-y-2">
          <Label htmlFor="land_area_m2">Terreno m²</Label>
          <Input id="land_area_m2" type="number" value={formData.land_area_m2 || ''} onChange={(e) => handleChange('land_area_m2', parseInt(e.target.value))} />
        </div>

        {/* Campos para propiedades con construcción (todo excepto terrenos) */}
        {formData.property_type !== 'terreno' && (
          <div className="space-y-2">
            <Label htmlFor="construction_area_m2">Constr. m²</Label>
            <Input id="construction_area_m2" type="number" value={formData.construction_area_m2 || ''} onChange={(e) => handleChange('construction_area_m2', parseInt(e.target.value))} />
          </div>
        )}
        
        {/* Campos para propiedades residenciales (casa o departamento) */}
        {(formData.property_type === 'casa' || formData.property_type === 'departamento') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Recámaras</Label>
              <Input id="bedrooms" type="number" value={formData.bedrooms || ''} onChange={(e) => handleChange('bedrooms', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_bathrooms">Baños</Label>
              <Input id="full_bathrooms" type="number" value={formData.full_bathrooms || ''} onChange={(e) => handleChange('full_bathrooms', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="half_bathrooms">1/2 Baños</Label>
              <Input id="half_bathrooms" type="number" value={formData.half_bathrooms || ''} onChange={(e) => handleChange('half_bathrooms', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parking_spaces">Estac.</Label>
              <Input id="parking_spaces" type="number" value={formData.parking_spaces || ''} onChange={(e) => handleChange('parking_spaces', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="levels">Niveles</Label>
              <Input id="levels" type="number" value={formData.levels || ''} onChange={(e) => handleChange('levels', parseInt(e.target.value))} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_new_property" checked={formData.is_new_property} onCheckedChange={(checked) => handleChange('is_new_property', checked)} />
              <Label htmlFor="is_new_property">¿Vivienda Nueva?</Label>
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="days_on_market">Días en el Mercado</Label>
          <Input id="days_on_market" type="number" value={daysOnMarket} onChange={(e) => handleDaysChange(e.target.value)} />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
        </div>
      </div>
      <div className="mt-4">
        <Label>Buscar Dirección en el Mapa</Label>
        <div className="flex gap-2 mt-1">
          <Input 
            value={mapSearch} 
            onChange={(e) => setMapSearch(e.target.value)} 
            placeholder="Escribe una dirección..."
          />
          <Button type="button" onClick={handleMapSearch}>Buscar</Button>
        </div>
        <div className="h-64 w-full rounded-lg overflow-hidden mt-2">
          <MapContainer center={[formData.latitude, formData.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
            <MapViewUpdater />
          </MapContainer>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Guardar Cambios</Button>
      </DialogFooter>
    </form>
  );
}
