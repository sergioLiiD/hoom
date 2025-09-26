# Proyecto: Hoom - Herramienta de Captura de Propiedades

## 1. Objetivo

Crear una herramienta interna y personal (Extensión de Chrome) para extraer información de propiedades de diversos portales inmobiliarios en México, superando las protecciones de Cloudflare. La información se centralizará en una base de datos para su posterior análisis y visualización.

## 2. Arquitectura Tecnológica

- **Extracción de Datos**: Extensión de Chrome privada (modo desarrollador).
- **Backend y Base de Datos**: Supabase (PostgreSQL + APIs automáticas).
- **Dashboard de Análisis**: Streamlit.
- **Mapas y Geolocalización**: Mapbox.

## 3. Flujo de Trabajo

1.  El usuario navega a una página de una propiedad en un portal soportado.
2.  Activa la extensión de Chrome.
3.  La extensión extrae automáticamente la mayor cantidad de datos posible de la página.
4.  El usuario completa o corrige los datos en la interfaz de la extensión.
5.  Al guardar, la extensión envía los datos a la base de datos en Supabase, verificando que la URL no esté duplicada.
6.  Los datos se pueden visualizar y analizar en un dashboard de Streamlit.

## 4. Estructura de Datos

### Tabla: `properties`

- `id` (UUID, PK)
- `created_at` (timestamp)
- `source_portal` (text) - ej: 'inmuebles24', 'lamudi', etc.
- `property_url` (text, unique) - URL original del anuncio.
- `title` (text)
- `price` (numeric)
- `location_text` (text) - Dirección o zona como aparece en el portal.
- `latitude` (numeric)
- `longitude` (numeric)
- `land_area_m2` (numeric)
- `construction_area_m2` (numeric)
- `bedrooms` (integer)
- `full_bathrooms` (integer)
- `half_bathrooms` (integer)
- `parking_spaces` (integer)
- `levels` (integer)
- `description` (text)
- `photos` (array of text) - Arreglo de URLs de las imágenes.
- `seller_id` (UUID, FK a `sellers`)

### Tabla: `sellers`

- `id` (UUID, PK)
- `created_at` (timestamp)
- `name` (text)
- `phone` (text)
- `email` (text)

## 5. Plan de Desarrollo

- **Fase 1**: Configuración de la Base de Datos en Supabase.
- **Fase 2**: Creación del esqueleto de la Extensión de Chrome.
- **Fase 3**: Implementación de la lógica de extracción para el primer portal.
- **Fase 4**: Conexión de la Extensión con Supabase.
- **Fase 5**: Creación del Dashboard de análisis con Streamlit.
- **Fase 6**: Expansión a más portales.
