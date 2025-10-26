import L from 'leaflet';

// Función para mezclar colores (para crear versiones más claras para propiedades en renta)
export function mixColors(color1, color2, weight) {
  function d2h(d) { return d.toString(16).padStart(2, '0'); }
  function h2d(h) { return parseInt(h, 16); }
  
  let color = "#";
  for(let i = 1; i <= 5; i += 2) {
    const c1 = h2d(color1.substr(i, 2));
    const c2 = h2d(color2.substr(i, 2));
    color += d2h(Math.round(c1 * (1 - weight) + c2 * weight));
  }
  return color;
}

// Crear iconos personalizados para cada tipo de propiedad y tipo de listado
export const createPropertyIcon = (color, isRental = false) => {
  // Para propiedades en renta, usamos un borde diferente
  const borderStyle = isRental ? '2px dashed white' : '2px solid white';
  // Para propiedades en renta, usamos un color más claro (mezclado con blanco)
  const bgColor = isRental ? mixColors(color, '#ffffff', 0.3) : color;
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${bgColor}; width: 16px; height: 16px; border-radius: 50%; border: ${borderStyle}; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

// Colores base para cada tipo de propiedad
export const propertyColors = {
  casa: '#3b82f6', // Azul
  terreno: '#22c55e', // Verde
  departamento: '#a855f7', // Morado
  oficina: '#64748b', // Gris
  local_comercial: '#f59e0b', // Ámbar
  bodega: '#f97316', // Naranja
  default: '#ef4444' // Rojo para tipos desconocidos
};

// Crear iconos para cada combinación de tipo de propiedad y tipo de listado
export const propertyIcons = {};

// Generar iconos para propiedades en venta
Object.keys(propertyColors).forEach(type => {
  propertyIcons[`${type}_venta`] = createPropertyIcon(propertyColors[type], false);
});

// Generar iconos para propiedades en renta
Object.keys(propertyColors).forEach(type => {
  propertyIcons[`${type}_renta`] = createPropertyIcon(propertyColors[type], true);
});

// Iconos por defecto
propertyIcons.default_venta = createPropertyIcon(propertyColors.default, false);
propertyIcons.default_renta = createPropertyIcon(propertyColors.default, true);

// Función para obtener el icono adecuado según el tipo de propiedad y listado
export const getPropertyIcon = (property) => {
  if (!property) return propertyIcons.default_venta;
  
  const propertyType = property.property_type || 'default';
  const listingType = property.listing_type || 'venta';
  const iconKey = `${propertyType}_${listingType}`;
  
  return propertyIcons[iconKey] || 
         (listingType === 'renta' ? propertyIcons.default_renta : propertyIcons.default_venta);
};
