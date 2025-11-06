# Instrucciones de Despliegue para Hoom Properties Search

Este documento contiene instrucciones para desplegar la aplicación Hoom Properties Search en diferentes entornos.

## Archivos de Build

El directorio `dist` contiene todos los archivos necesarios para el despliegue. También se ha generado un archivo `dist.zip` que contiene todo el directorio comprimido para facilitar la subida.

## Opciones de Despliegue

### 1. Servidor Web Tradicional (Apache, Nginx)

1. Sube todo el contenido del directorio `dist` al directorio raíz de tu servidor web.
2. Asegúrate de que el archivo `.htaccess` se haya subido correctamente (para Apache).
3. Para Nginx, configura la redirección de todas las rutas a `index.html`:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 2. Netlify

1. Sube el directorio `dist` a Netlify.
2. El archivo `_redirects` ya está incluido para manejar las rutas de React Router.

### 3. Vercel

1. Sube el proyecto a Vercel.
2. El archivo `vercel.json` ya está incluido para manejar las rutas de React Router.

## Configuración de Supabase

Asegúrate de que la URL y la clave anónima de Supabase estén correctamente configuradas para el entorno de producción. Estas se encuentran en:

```
/src/lib/supabaseClient.js
```

## Notas Importantes

- La aplicación utiliza React Router para la navegación, por lo que es crucial que todas las rutas se redirijan a `index.html`.
- Si tienes problemas con CORS, asegúrate de que tu servidor Supabase permita solicitudes desde el dominio donde has desplegado la aplicación.
