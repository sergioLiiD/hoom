-- Verificar si la columna days_on_market ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'days_on_market'
    ) THEN
        -- Agregar la columna days_on_market si no existe
        ALTER TABLE public.properties
        ADD COLUMN days_on_market INTEGER;
        
        -- Actualizar days_on_market para propiedades existentes basado en publication_date
        UPDATE public.properties
        SET days_on_market = EXTRACT(DAY FROM (created_at - publication_date))
        WHERE publication_date IS NOT NULL;
        
        -- Agregar un comentario para documentación
        COMMENT ON COLUMN public.properties.days_on_market IS 'Número de días que la propiedad ha estado en el mercado';
    END IF;
END $$;
