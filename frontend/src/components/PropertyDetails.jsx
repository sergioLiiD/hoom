import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Home, Trees, Building2, Building, Store, Warehouse } from 'lucide-react';
import { getPropertyIcon } from '@/lib/mapIcons';

export default function PropertyDetails({ property }) {
  const hasCoordinates = property.latitude && property.longitude;
  const captureDate = property.created_at ? new Date(property.created_at).toLocaleDateString('es-MX') : 'N/A';

  // Calcular los días en el mercado
  let daysOnMarket = 'N/A';
  let publicationDate = null;
  
  // Si tenemos days_on_market guardado, lo usamos
  if (property.days_on_market) {
    daysOnMarket = property.days_on_market;
    if (property.created_at) {
      publicationDate = new Date(property.created_at);
      publicationDate.setDate(publicationDate.getDate() - property.days_on_market);
    }
  }
  // Si tenemos publication_date, calculamos los días
  else if (property.publication_date) {
    publicationDate = new Date(property.publication_date);
    if (property.created_at) {
      const captureDate = new Date(property.created_at);
      const diffTime = Math.abs(captureDate - publicationDate);
      daysOnMarket = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }
  
  const publicationDateFormatted = publicationDate ? publicationDate.toLocaleDateString('es-MX') : 'N/A';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Fotografías</h3>
        <Carousel className="w-full max-w-full mt-2">
          <CarouselContent>
            {property.photos?.length > 0 ? (
              property.photos.map((photo, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-video items-center justify-center p-0">
                        <img src={photo} alt={`Property photo ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem>
                <div className="p-1">
                  <Card>
                    <CardContent className="flex aspect-video items-center justify-center p-6 bg-muted rounded-lg">
                      <span className="text-muted-foreground">No hay fotos disponibles</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
        </Carousel>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Detalles Principales</h3>
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <div className="font-semibold">Tipo de Propiedad:</div>
          <div className="flex items-center gap-2">
            {property.property_type === 'casa' && <>
              <Home className="h-5 w-5 text-blue-600" />
              <span>Casa</span>
            </>}
            {property.property_type === 'terreno' && <>
              <Trees className="h-5 w-5 text-green-600" />
              <span>Terreno</span>
            </>}
            {property.property_type === 'departamento' && <>
              <Building2 className="h-5 w-5 text-purple-600" />
              <span>Departamento</span>
            </>}
            {property.property_type === 'oficina' && <>
              <Building className="h-5 w-5 text-gray-600" />
              <span>Oficina</span>
            </>}
            {property.property_type === 'local_comercial' && <>
              <Store className="h-5 w-5 text-amber-600" />
              <span>Local Comercial</span>
            </>}
            {property.property_type === 'bodega' && <>
              <Warehouse className="h-5 w-5 text-orange-600" />
              <span>Bodega</span>
            </>}
            {!property.property_type && 'No especificado'}
          </div>

          <div className="font-semibold">Precio:</div>
          <div>{property.price ? property.price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : 'No disponible'}</div>
          
          <div className="font-semibold">Fraccionamiento:</div>
          <div>{property.fraccionamientos?.nombre || 'No especificado'}</div>

          {/* Área del terreno (para todos los tipos) */}
          <div className="font-semibold">Área del Terreno:</div>
          <div>{property.land_area_m2 ? `${property.land_area_m2} m²` : 'No disponible'}</div>
          
          {/* Campos para propiedades con construcción */}
          {(property.property_type === 'casa' || property.property_type === 'departamento' || 
            property.property_type === 'oficina' || property.property_type === 'local_comercial' || 
            property.property_type === 'bodega') && (
            <>
              <div className="font-semibold">Área de Construcción:</div>
              <div>{property.construction_area_m2 ? `${property.construction_area_m2} m²` : 'No disponible'}</div>
            </>
          )}
          
          {/* Campos para propiedades residenciales */}
          {(property.property_type === 'casa' || property.property_type === 'departamento') && (
            <>
              <div className="font-semibold">Habitaciones:</div>
              <div>{property.bedrooms || 'No disponible'}</div>
              
              <div className="font-semibold">Baños Completos:</div>
              <div>{property.full_bathrooms || 'No disponible'}</div>
              
              <div className="font-semibold">Medios Baños:</div>
              <div>{property.half_bathrooms || 'No disponible'}</div>
              
              <div className="font-semibold">Niveles:</div>
              <div>{property.levels || 'No disponible'}</div>

              <div className="font-semibold">Propiedad Nueva:</div>
              <div>{property.is_new_property ? 'Sí' : 'No'}</div>
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Descripción</h3>
        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{property.description || "No hay descripción disponible."}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Ubicación</h3>
        {hasCoordinates ? (
          <div className="mt-2 aspect-video w-full rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <MapContainer center={[property.latitude, property.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker 
                position={[property.latitude, property.longitude]}
                icon={getPropertyIcon(property)}
              >
                <Popup>
                  {property.title || 'Propiedad'}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">No hay datos de ubicación para mostrar el mapa.</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold">Detalles Adicionales</h3>
        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
          <div className="font-semibold">Portal de Origen:</div>
          <div>{property.source_portal || 'N/A'}</div>
          <div className="font-semibold">Fecha de Captura:</div>
          <div>{captureDate}</div>
          <div className="font-semibold">Fecha de Publicación:</div>
          <div>{publicationDateFormatted}</div>
          <div className="font-semibold">Días en el Mercado:</div>
          <div>{daysOnMarket}</div>
        </div>
      </div>
    </div>
  );
}
