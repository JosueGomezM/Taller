/*
  # Actualizar nombre de usuario

  1. Cambios
    - Actualizar el nombre completo del usuario jgomez@multiecocr.com a "Josue Gomez"
*/

UPDATE users 
SET full_name = 'Josue Gomez'
WHERE email = 'jgomez@multiecocr.com';