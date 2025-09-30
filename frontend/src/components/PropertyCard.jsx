import { Button } from "./ui/button";

const PropertyCard = ({ property, onDetailsClick }) => {
  const pricePerSqm = property.construction_area_m2 > 0 
    ? (property.price / property.construction_area_m2) 
    : 0;

  return (
    <div className="w-64">
      <img src={property.photos?.[0] || 'https://via.placeholder.com/250x150'} alt={property.title} className="w-full h-32 object-cover rounded-t-lg" />
      <div className="p-3">
        <h3 className="font-bold text-md truncate">{property.title}</h3>
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
