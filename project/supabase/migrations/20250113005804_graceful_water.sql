-- Eliminar registros existentes de forma segura
DO $$
BEGIN
    -- Primero eliminar de la tabla users
    DELETE FROM users WHERE email = 'gvargas@multiecocr.com';
    
    -- Luego eliminar de auth.users
    DELETE FROM auth.users WHERE email = 'gvargas@multiecocr.com';
    
    -- Esperar un momento para asegurar que la eliminación se complete
    PERFORM pg_sleep(1);
    
    -- Verificar que no existan registros
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'gvargas@multiecocr.com'
    ) AND NOT EXISTS (
        SELECT 1 FROM users WHERE email = 'gvargas@multiecocr.com'
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
                'gvargas@multiecocr.com',
                crypt('Samu2025', gen_salt('bf')),
                now(),
                '{"provider":"email","providers":["email"]}',
                '{"full_name":"Greivin Vargas"}',
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
                'gvargas@multiecocr.com',
                'admin',
                'Greivin Vargas'
            );
        END;
    END IF;
END $$;