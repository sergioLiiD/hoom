-- Script para mejorar la gestión de usuarios en Supabase
-- Este script añade funcionalidad para desactivar usuarios en lugar de eliminarlos
-- y mejora el manejo de roles y permisos

-- Verificar si las tablas necesarias existen y crearlas si no
DO $$
BEGIN
  -- Verificar si existe la tabla user_roles
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    CREATE TABLE public.user_roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Insertar roles básicos
    INSERT INTO public.user_roles (id, name) VALUES 
      (1, 'owner'),
      (2, 'admin'),
      (3, 'user');
  END IF;
  
  -- Verificar si existe la tabla user_profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    CREATE TABLE public.user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      full_name TEXT,
      role_id INTEGER REFERENCES public.user_roles(id) DEFAULT 3,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      disabled_at TIMESTAMP WITH TIME ZONE,
      disabled_by UUID REFERENCES auth.users(id),
      reactivated_at TIMESTAMP WITH TIME ZONE,
      reactivated_by UUID REFERENCES auth.users(id)
    );
  END IF;
  
  -- Verificar si existe la tabla user_activity_logs
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_logs') THEN
    CREATE TABLE public.user_activity_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      action_type TEXT NOT NULL,
      performed_by UUID NOT NULL REFERENCES auth.users(id),
      target_user_id UUID REFERENCES auth.users(id),
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END $$;

-- Función mejorada para desactivar usuarios en lugar de eliminarlos completamente
-- Esta función marca al usuario como inactivo en lugar de eliminarlo
DROP FUNCTION IF EXISTS public.disable_user(UUID);
CREATE FUNCTION public.disable_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_owner BOOLEAN;
  target_exists BOOLEAN;
  current_user_id UUID;
  log_id UUID;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar si el usuario actual es owner
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = current_user_id AND role_id = 1
  ) INTO is_owner;
  
  -- Solo los owners pueden desactivar usuarios
  IF NOT is_owner THEN
    RAISE EXCEPTION 'Solo los usuarios con rol de owner pueden desactivar otros usuarios';
    RETURN FALSE;
  END IF;
  
  -- Verificar si el usuario objetivo existe
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = target_user_id
  ) INTO target_exists;
  
  IF NOT target_exists THEN
    RAISE EXCEPTION 'El usuario objetivo no existe';
    RETURN FALSE;
  END IF;
  
  -- No permitir desactivar al propio usuario
  IF current_user_id = target_user_id THEN
    RAISE EXCEPTION 'No puedes desactivar tu propio usuario';
    RETURN FALSE;
  END IF;
  
  -- Registrar la acción en el log de actividad
  INSERT INTO user_activity_logs (
    action_type,
    performed_by,
    target_user_id,
    details
  ) VALUES (
    'DISABLE_USER',
    current_user_id,
    target_user_id,
    jsonb_build_object('method', 'disable_user', 'timestamp', now())
  ) RETURNING id INTO log_id;
  
  -- Actualizar el perfil del usuario para marcarlo como inactivo
  UPDATE user_profiles
  SET is_active = FALSE, 
      disabled_at = now(),
      disabled_by = current_user_id
  WHERE id = target_user_id;
  
  -- Actualizar el registro en el log con el resultado
  UPDATE user_activity_logs
  SET details = details || jsonb_build_object('success', TRUE)
  WHERE id = log_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- Registrar el error en el log
  IF log_id IS NOT NULL THEN
    UPDATE user_activity_logs
    SET details = details || jsonb_build_object('success', FALSE, 'error', SQLERRM)
    WHERE id = log_id;
  END IF;
  
  RAISE;
END;
$$;

-- Función para reactivar un usuario previamente desactivado
DROP FUNCTION IF EXISTS public.reactivate_user(UUID);
CREATE FUNCTION public.reactivate_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_owner BOOLEAN;
  target_exists BOOLEAN;
  is_inactive BOOLEAN;
  current_user_id UUID;
  log_id UUID;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar si el usuario actual es owner
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = current_user_id AND role_id = 1
  ) INTO is_owner;
  
  -- Solo los owners pueden reactivar usuarios
  IF NOT is_owner THEN
    RAISE EXCEPTION 'Solo los usuarios con rol de owner pueden reactivar otros usuarios';
    RETURN FALSE;
  END IF;
  
  -- Verificar si el usuario objetivo existe
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = target_user_id
  ) INTO target_exists;
  
  IF NOT target_exists THEN
    RAISE EXCEPTION 'El usuario objetivo no existe';
    RETURN FALSE;
  END IF;
  
  -- Verificar si el usuario está inactivo
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = target_user_id AND is_active = FALSE
  ) INTO is_inactive;
  
  IF NOT is_inactive THEN
    RAISE EXCEPTION 'El usuario ya está activo';
    RETURN FALSE;
  END IF;
  
  -- Registrar la acción en el log de actividad
  INSERT INTO user_activity_logs (
    action_type,
    performed_by,
    target_user_id,
    details
  ) VALUES (
    'REACTIVATE_USER',
    current_user_id,
    target_user_id,
    jsonb_build_object('method', 'reactivate_user', 'timestamp', now())
  ) RETURNING id INTO log_id;
  
  -- Actualizar el perfil del usuario para marcarlo como activo
  UPDATE user_profiles
  SET is_active = TRUE, 
      disabled_at = NULL,
      disabled_by = NULL,
      reactivated_at = now(),
      reactivated_by = current_user_id
  WHERE id = target_user_id;
  
  -- Actualizar el registro en el log con el resultado
  UPDATE user_activity_logs
  SET details = details || jsonb_build_object('success', TRUE)
  WHERE id = log_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- Registrar el error en el log
  IF log_id IS NOT NULL THEN
    UPDATE user_activity_logs
    SET details = details || jsonb_build_object('success', FALSE, 'error', SQLERRM)
    WHERE id = log_id;
  END IF;
  
  RAISE;
END;
$$;

-- Tabla para registrar la actividad de los usuarios
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Verificar si hay columnas faltantes en la tabla user_profiles y añadirlas si es necesario
DO $$
BEGIN
  -- Verificar si la tabla existe antes de intentar modificarla
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Añadir columna is_active si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'is_active'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Añadir columna disabled_at si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'disabled_at'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN disabled_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Añadir columna disabled_by si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'disabled_by'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN disabled_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Añadir columna reactivated_at si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'reactivated_at'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN reactivated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Añadir columna reactivated_by si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'reactivated_by'
    ) THEN
      ALTER TABLE public.user_profiles ADD COLUMN reactivated_by UUID REFERENCES auth.users(id);
    END IF;
  END IF;
END $$;

-- Función para obtener el historial de actividad de un usuario
DROP FUNCTION IF EXISTS public.get_user_activity_history(UUID);
CREATE FUNCTION public.get_user_activity_history(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  performed_by UUID,
  performer_name TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.action_type,
    l.performed_by,
    p.full_name AS performer_name,
    l.details,
    l.created_at
  FROM 
    user_activity_logs l
    LEFT JOIN user_profiles p ON l.performed_by = p.id
  WHERE 
    l.target_user_id = target_user_id
  ORDER BY 
    l.created_at DESC;
END;
$$;

-- Función para verificar si un usuario está activo
DROP FUNCTION IF EXISTS public.is_user_active(UUID);
CREATE FUNCTION public.is_user_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active BOOLEAN;
BEGIN
  SELECT is_active INTO active
  FROM user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(active, FALSE);
END;
$$;

-- Eliminar la función get_user_role_info existente antes de recrearla con un nuevo tipo de retorno
DROP FUNCTION IF EXISTS public.get_user_role_info(UUID);

-- Crear la nueva función get_user_role_info que incluye verificación de usuario activo
CREATE FUNCTION public.get_user_role_info(user_id UUID)
RETURNS TABLE (
  role_id INTEGER,
  role_name TEXT,
  full_name TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.role_id,
    r.name AS role_name,
    p.full_name,
    p.is_active
  FROM 
    user_profiles p
    JOIN user_roles r ON p.role_id = r.id
  WHERE 
    p.id = user_id;
END;
$$;

-- Comentar la función delete_user original para evitar su uso
DO $$
BEGIN
  -- Verificar si la función delete_user existe antes de comentarla
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'delete_user') THEN
    COMMENT ON FUNCTION public.delete_user(UUID) IS 'DEPRECATED: Esta función ha sido reemplazada por disable_user() para evitar problemas de integridad referencial. No usar.';
  END IF;
END $$;
