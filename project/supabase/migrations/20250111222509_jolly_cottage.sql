/*
  # Corregir configuración del sistema
  
  1. Asegurar tabla y datos
    - Verificar existencia de la tabla system_settings
    - Insertar o actualizar el logo_url
    - Asegurar políticas de seguridad
*/

-- Asegurar que la tabla existe
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Asegurar que el logo existe
DO $$ 
BEGIN 
  INSERT INTO system_settings (key, value)
  VALUES ('logo_url', 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/multiservicios-ecologicos-logo.png')
  ON CONFLICT (key) DO UPDATE 
  SET value = EXCLUDED.value,
      updated_at = now();
END $$;