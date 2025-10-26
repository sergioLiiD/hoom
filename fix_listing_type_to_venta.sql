-- Script para asegurarse de que todas las propiedades existentes estén marcadas como 'venta'

-- Verificar el estado actual de las propiedades
SELECT listing_type, COUNT(*) as count
FROM public.properties
GROUP BY listing_type;

-- Actualizar TODAS las propiedades a 'venta'
UPDATE public.properties
SET listing_type = 'venta';

-- Verificar que todas las propiedades ahora están marcadas como 'venta'
SELECT listing_type, COUNT(*) as count
FROM public.properties
GROUP BY listing_type;
