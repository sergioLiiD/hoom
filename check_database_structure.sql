-- Verificar qué tablas existen en la base de datos
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Contar registros en cada tabla
SELECT 'properties' AS table_name, COUNT(*) AS record_count FROM public.properties
UNION ALL
SELECT 'promoters' AS table_name, COUNT(*) AS record_count FROM public.promoters
UNION ALL
SELECT 'fraccionamientos' AS table_name, COUNT(*) AS record_count FROM public.fraccionamientos
ORDER BY record_count DESC;

-- Verificar la estructura de la tabla properties
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;
