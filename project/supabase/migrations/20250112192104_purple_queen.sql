/*
  # Crear usuario administrador Pablo Quirós

  1. Cambios
    - Crear nuevo usuario administrador
    - Asignar rol de administrador
*/

INSERT INTO users (id, email, role, full_name)
VALUES (
  gen_random_uuid(),
  'pquiros@multiecocr.com',
  'admin',
  'Pablo Quiros'
);