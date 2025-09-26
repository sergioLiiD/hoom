import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function PropertyDetails({ property }) {
  const hasCoordinates = property.latitude && property.longitude;
  const captureDate = property.created_at ? new Date(property.created_at).toLocaleDateString('es-MX') : 'N/A';

  const publicationDate = property.publication_date ? new Date(property.publication_date) : null;
  let daysOnMarket = 'N/A';
  if (publicationDate) {
    const today = new Date();
    const diffTime = Math.abs(today - publicationDate);
    daysOnMarket = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
              <Marker position={[property.latitude, property.longitude]}>
                <Popup>
                  {property.title}
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
