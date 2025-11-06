#!/bin/bash

# Script para realizar copias de seguridad de la base de datos de Supabase
# Requiere tener instalado PostgreSQL y configurado el acceso a la base de datos

# Configuración
BACKUP_DIR="/Users/sergio/Projects/hoom-propierties-search/backups"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/supabase_backup_$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup_log.txt"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Función para registrar mensajes en el log
log_message() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" >> "$LOG_FILE"
  echo "$1"
}

# Verificar si las variables de entorno están configuradas
if [ -z "$SUPABASE_DB_URL" ]; then
  log_message "ERROR: La variable de entorno SUPABASE_DB_URL no está configurada"
  log_message "Ejemplo: export SUPABASE_DB_URL=postgresql://postgres:password@db.vespwditkwvlglxciwwv.supabase.co:5432/postgres"
  exit 1
fi

# Realizar la copia de seguridad
log_message "Iniciando copia de seguridad de la base de datos..."
pg_dump "$SUPABASE_DB_URL" > "$BACKUP_FILE" 2>> "$LOG_FILE"

# Verificar si la copia de seguridad fue exitosa
if [ $? -eq 0 ]; then
  log_message "Copia de seguridad completada exitosamente: $BACKUP_FILE"
  
  # Comprimir el archivo de backup
  gzip "$BACKUP_FILE"
  log_message "Archivo comprimido: $BACKUP_FILE.gz"
  
  # Eliminar backups antiguos (mantener los últimos 7 días)
  find "$BACKUP_DIR" -name "supabase_backup_*.sql.gz" -type f -mtime +7 -delete
  log_message "Backups antiguos eliminados"
else
  log_message "ERROR: La copia de seguridad falló"
fi

# Mostrar estadísticas
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "supabase_backup_*.sql.gz" | wc -l)
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log_message "Estadísticas de backups:"
log_message "- Número de backups: $BACKUP_COUNT"
log_message "- Tamaño total de backups: $BACKUP_SIZE"
log_message "- Directorio de backups: $BACKUP_DIR"

exit 0
