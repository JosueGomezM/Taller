/*
  # Corregir registro de usuario existente
  
  1. Cambios
    - Elimina usuario existente de forma segura
    - Asegura que no haya registros duplicados
*/

-- Eliminar registros existentes de forma segura
DO $$
BEGIN
    -- Primero eliminar de la tabla users
    DELETE FROM users WHERE email = 'pquiros@multiecocr.com';
    
    -- Luego eliminar de auth.users
    DELETE FROM auth.users WHERE email = 'pquiros@multiecocr.com';
    
    -- Esperar un momento para asegurar que la eliminación se complete
    PERFORM pg_sleep(1);
    
    -- Verificar que no existan registros
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'pquiros@multiecocr.com'
    ) AND NOT EXISTS (
        SELECT 1 FROM users WHERE email = 'pquiros@multiecocr.com'
    ) THEN
        -- Crear nuevo usuario con UUID específico
        DECLARE
            new_user_id uuid := gen_random_uuid();
        BEGIN
            -- Insertar en auth.users primero
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
                recovery_token,
                aud,
                role
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
                '',
                'authenticated',
                'authenticated'
            );

            -- Luego insertar en users
            INSERT INTO users (id, email, role, full_name)
            VALUES (
                new_user_id,
                'pquiros@multiecocr.com',
                'admin',
                'Pablo Quiros'
            );
        END;
    END IF;
END $$;