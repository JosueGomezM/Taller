/*
  # Actualizar rol de usuario a administrador

  1. Cambios
    - Actualiza el rol del usuario jgomez@multiecocr.com a 'admin'
*/

UPDATE users 
SET role = 'admin'::user_role 
WHERE email = 'jgomez@multiecocr.com';