/*
  # Corregir políticas de system_settings
  
  1. Seguridad
    - Habilitar RLS en la tabla system_settings
    - Agregar política para permitir lectura a todos los usuarios autenticados
*/

-- Habilitar RLS si no está habilitado
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Permitir lectura de configuración" ON system_settings;

-- Crear nueva política de lectura
CREATE POLICY "Permitir lectura de configuración"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Asegurar que los datos existan
INSERT INTO system_settings (key, value)
VALUES ('logo_url', 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/multiservicios-ecologicos-logo.png')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value,
    updated_at = now();