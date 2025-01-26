/*
  # Crear usuario administrador
  
  1. Cambios
    - Eliminar usuario existente si existe
    - Crear nuevo usuario con UUID generado
*/

-- Eliminar el usuario existente si existe
DELETE FROM auth.users WHERE email = 'pquiros@multiecocr.com';
DELETE FROM users WHERE email = 'pquiros@multiecocr.com';

-- Crear el usuario con un UUID específico
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
BEGIN
    -- Insertar en la tabla users primero
    INSERT INTO users (id, email, role, full_name)
    VALUES (
        new_user_id,
        'pquiros@multiecocr.com',
        'admin',
        'Pablo Quiros'
    );

    -- Luego insertar en auth.users usando el mismo ID
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'pquiros@multiecocr.com',
        crypt('pquiros2025', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Pablo Quiros"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    );
END $$;