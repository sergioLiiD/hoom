# Guía de Seguridad para Hoom Properties

## Gestión de Usuarios y Autenticación

### Cambios Implementados

1. **Desactivación de usuarios en lugar de eliminación**
   - Los usuarios ahora se desactivan en lugar de eliminarse completamente
   - Esto preserva la integridad referencial de la base de datos
   - Los usuarios desactivados no pueden iniciar sesión

2. **Verificación de estado activo**
   - El sistema ahora verifica si un usuario está activo antes de permitir el acceso
   - Los usuarios desactivados ven un mensaje claro indicando su estado

3. **Registro de actividad**
   - Todas las acciones relacionadas con usuarios (desactivación, reactivación) se registran
   - Se puede consultar el historial de actividad de cada usuario

4. **Manejo mejorado de sesiones**
   - Se ha implementado una página de cierre de sesión forzado para solucionar problemas
   - Se ha mejorado el manejo de errores en la autenticación

### Cómo Usar las Nuevas Funciones

#### Para Administradores

1. **Desactivar un usuario**
   - Accede a la página de Configuración
   - En la sección de Usuarios, haz clic en "Desactivar" junto al usuario
   - Confirma la acción

2. **Reactivar un usuario**
   - Accede a la página de Configuración
   - En la sección de Usuarios, haz clic en "Reactivar" junto al usuario desactivado
   - Confirma la acción

3. **Ver historial de actividad**
   - Accede a la página de Configuración
   - En la sección de Usuarios, haz clic en "Historial" junto al usuario
   - Se mostrará un registro de todas las acciones realizadas sobre ese usuario

#### Para Usuarios

1. **Problemas de sesión**
   - Si experimentas problemas con tu sesión, navega a `/force-logout`
   - Usa la opción "Forzar Cierre de Sesión" para limpiar completamente tu sesión
   - Vuelve a iniciar sesión normalmente

## Copias de Seguridad

Se ha implementado un sistema de copias de seguridad automáticas para la base de datos de Supabase.

### Configuración

1. Configura la variable de entorno `SUPABASE_DB_URL` con la URL de conexión a tu base de datos:
   ```bash
   export SUPABASE_DB_URL=postgresql://postgres:password@db.vespwditkwvlglxciwwv.supabase.co:5432/postgres
   ```

2. Ejecuta el script de backup manualmente:
   ```bash
   ./backup_supabase.sh
   ```

3. Configura una tarea programada para ejecutar el script regularmente:
   ```bash
   # Edita el crontab
   crontab -e
   
   # Añade esta línea para ejecutar el backup diariamente a las 3 AM
   0 3 * * * /Users/sergio/Projects/hoom-propierties-search/backup_supabase.sh
   ```

### Restauración

Para restaurar una copia de seguridad:

1. Descomprime el archivo de backup:
   ```bash
   gunzip backups/supabase_backup_YYYY-MM-DD_HH-MM-SS.sql.gz
   ```

2. Restaura la base de datos:
   ```bash
   psql "$SUPABASE_DB_URL" < backups/supabase_backup_YYYY-MM-DD_HH-MM-SS.sql
   ```

## Recomendaciones de Seguridad

1. **Contraseñas Seguras**
   - Utiliza contraseñas fuertes y únicas
   - Considera implementar un sistema de autenticación de dos factores

2. **Gestión de Sesiones**
   - Cierra sesión cuando no estés utilizando la aplicación
   - No compartas tus credenciales con otros usuarios

3. **Actualizaciones Regulares**
   - Mantén actualizado el sistema y sus dependencias
   - Revisa regularmente los logs de actividad en busca de comportamientos sospechosos

4. **Copias de Seguridad**
   - Verifica regularmente que las copias de seguridad se estén realizando correctamente
   - Prueba ocasionalmente el proceso de restauración para asegurarte de que funciona
