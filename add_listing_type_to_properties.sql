-- Crear un tipo ENUM para los tipos de listado
CREATE TYPE public.listing_type_enum AS ENUM ('venta', 'renta');

-- Agregar la columna listing_type a la tabla properties
ALTER TABLE public.properties
ADD COLUMN listing_type public.listing_type_enum DEFAULT 'venta';

-- Actualizar todas las propiedades existentes como tipo 'venta'
UPDATE public.properties
SET listing_type = 'venta'
WHERE listing_type IS NULL;

-- Hacer la columna NOT NULL para garantizar la integridad de los datos
ALTER TABLE public.properties
ALTER COLUMN listing_type SET NOT NULL;

-- Agregar un comentario para documentación
COMMENT ON COLUMN public.properties.listing_type IS 'Tipo de listado: venta o renta';
