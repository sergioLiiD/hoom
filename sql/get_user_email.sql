-- Función para obtener el email de un usuario por su ID
-- Esta función debe ser ejecutada en la base de datos de Supabase
CREATE OR REPLACE FUNCTION public.get_user_email(target_user_id UUID)
RETURNS TABLE(email TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_user_role INT;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar si el usuario actual existe
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuario autenticado';
  END IF;
  
  -- Obtener el rol del usuario actual
  SELECT role_id INTO current_user_role
  FROM public.user_profiles
  WHERE id = current_user_id;
  
  -- Verificar si el usuario tiene permisos para obtener emails (solo owner o admin)
  IF current_user_role IS NULL OR (current_user_role != 1 AND current_user_role != 2) THEN
    RAISE EXCEPTION 'No tienes permisos para obtener emails de usuarios';
  END IF;
  
  -- Devolver el email del usuario solicitado
  RETURN QUERY
  SELECT au.email
  FROM auth.users au
  WHERE au.id = target_user_id;
END;
$$;
