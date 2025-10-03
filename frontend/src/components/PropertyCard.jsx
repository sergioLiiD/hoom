import { Button } from "./ui/button";
import { Home, Trees, Building2, Building, Store, Warehouse } from 'lucide-react';

const PropertyCard = ({ property, onDetailsClick }) => {
  // Calcular precio por m² según el tipo de propiedad
  let pricePerSqm = 0;
  if (property.property_type === 'terreno' && property.land_area_m2 > 0) {
    pricePerSqm = property.price / property.land_area_m2;
  } else if (property.construction_area_m2 > 0) {
    pricePerSqm = property.price / property.construction_area_m2;
  }

  return (
    <div className="w-64">
      <img src={property.photos?.[0] || 'https://via.placeholder.com/250x150'} alt={property.title} className="w-full h-32 object-cover rounded-t-lg" />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {property.property_type === 'casa' && <Home className="h-4 w-4 flex-shrink-0 text-blue-600" />}
          {property.property_type === 'terreno' && <Trees className="h-4 w-4 flex-shrink-0 text-green-600" />}
          {property.property_type === 'departamento' && <Building2 className="h-4 w-4 flex-shrink-0 text-purple-600" />}
          {property.property_type === 'oficina' && <Building className="h-4 w-4 flex-shrink-0 text-gray-600" />}
          {property.property_type === 'local_comercial' && <Store className="h-4 w-4 flex-shrink-0 text-amber-600" />}
          {property.property_type === 'bodega' && <Warehouse className="h-4 w-4 flex-shrink-0 text-orange-600" />}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${property.is_new_property ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            {property.is_new_property ? 'Nueva' : 'Usada'}
          </span>
        </div>
        <h3 className="font-bold text-md line-clamp-2 h-10 mb-2">{property.title}</h3>
        <p className="text-lg font-semibold text-green-600">{property.price.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
        {pricePerSqm > 0 && (
          <p className="text-sm text-gray-500">{pricePerSqm.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} / m²</p>
        )}
        <Button onClick={() => onDetailsClick(property)} className="w-full mt-3">Ver Detalles</Button>
      </div>
    </div>
  );
};

export default PropertyCard;
