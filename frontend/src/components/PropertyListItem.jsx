import { Button } from "@/components/ui/button";
import Metric from "@/components/Metric";
import { Bed, Bath, Ruler, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PropertyListItem({ property, onEdit, onDelete, onViewDetails, onEditPhotos }) {
  return (
    <div className="flex items-center gap-4 p-2 border-b hover:bg-muted/50">
      <img 
        src={property.photos?.[0] || 'https://via.placeholder.com/100x80.png?text=Sin+Foto'}
        alt={property.title}
        className="rounded-md object-cover h-20 w-24"
        referrerPolicy="no-referrer"
      />
      <div className="flex-1">
        <h3 className="font-semibold">{property.title || "Sin Título"}</h3>
        <p className="text-sm text-muted-foreground">{property.location_text}</p>
        <div className="text-xs text-muted-foreground mt-1">Capturado: {new Date(property.created_at).toLocaleDateString('es-MX')}</div>
        <p className="font-bold text-primary mt-1">
          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(property.price || 0)}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground w-1/4">
        <Metric icon={<Bed className="w-4 h-4 mr-1" />} value={property.bedrooms} unit="rec." />
        <Metric icon={<Bath className="w-4 h-4 mr-1" />} value={property.full_bathrooms} unit="baños" />
        <Metric icon={<Ruler className="w-4 h-4 mr-1" />} value={property.construction_area_m2} unit="m²" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(property)}>Detalles</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(property)}>
              Editar Propiedad
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditPhotos(property)}>
              Editar Fotos
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={property.property_url} target="_blank" rel="noopener noreferrer" className="w-full">
                Ver Anuncio
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(property.id)} className="text-red-600">
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
