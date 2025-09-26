import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/supabaseClient';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapPage = () => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, latitude, longitude, price');

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data);
        console.log('Fetched properties:', data);
      }
    };

    fetchProperties();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <MapContainer center={[20.1276, -98.7325]} zoom={13} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map(property => (
          property.latitude && property.longitude && (
            <Marker key={property.id} position={[property.latitude, property.longitude]}>
              <Popup>
                <strong>{property.title}</strong><br />
                Price: {property.price}
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default MapPage;
