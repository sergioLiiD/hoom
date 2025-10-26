-- Modificar el tipo ENUM property_type_enum para incluir más tipos de propiedades
-- Cada valor debe añadirse en una transacción separada

-- Añadir 'departamento'
DO $$
BEGIN
    ALTER TYPE property_type_enum ADD VALUE IF NOT EXISTS 'departamento';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al añadir departamento: %', SQLERRM;
END
$$;
COMMIT;

-- Añadir 'oficina'
DO $$
BEGIN
    ALTER TYPE property_type_enum ADD VALUE IF NOT EXISTS 'oficina';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al añadir oficina: %', SQLERRM;
END
$$;
COMMIT;

-- Añadir 'local_comercial'
DO $$
BEGIN
    ALTER TYPE property_type_enum ADD VALUE IF NOT EXISTS 'local_comercial';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al añadir local_comercial: %', SQLERRM;
END
$$;
COMMIT;

-- Añadir 'bodega'
DO $$
BEGIN
    ALTER TYPE property_type_enum ADD VALUE IF NOT EXISTS 'bodega';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al añadir bodega: %', SQLERRM;
END
$$;
COMMIT;

-- Verificar que los valores se han añadido correctamente
SELECT enum_range(NULL::property_type_enum) AS property_types;
