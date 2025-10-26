-- Actualizar todas las propiedades existentes para asignarles el tipo 'casa'
UPDATE properties
SET property_type = 'casa';

-- Verificar que todas las propiedades tienen asignado el tipo 'casa'
SELECT COUNT(*) AS total_properties, 
       COUNT(CASE WHEN property_type = 'casa' THEN 1 END) AS casa_properties,
       COUNT(CASE WHEN property_type = 'terreno' THEN 1 END) AS terreno_properties
FROM properties;
