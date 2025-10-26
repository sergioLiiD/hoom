-- Verificar el esquema completo de la tabla properties
SELECT table_schema, table_name
FROM information_schema.tables 
WHERE table_name = 'properties';

-- Verificar si hay alguna tabla con nombre similar
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE '%propert%'
ORDER BY table_name;

-- Verificar si la columna property_type existe en la tabla properties
SELECT column_name, data_type, table_schema, table_name
FROM information_schema.columns
WHERE column_name = 'property_type' AND table_name = 'properties';

-- Intentar contar registros con un enfoque diferente
SELECT COUNT(*) FROM properties;

-- Verificar los primeros 5 registros para ver la estructura
SELECT * FROM properties LIMIT 5;
