/*
  # Agregar configuración del sistema
  
  1. Nueva Tabla
    - `system_settings`
      - `key` (text, primary key) - Identificador único de la configuración
      - `value` (text) - Valor de la configuración
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Seguridad
    - Habilitar RLS en la tabla system_settings
    - Agregar política para lectura pública
    - Agregar política para escritura solo por administradores
*/

CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar el logo
INSERT INTO system_settings (key, value) 
VALUES ('logo_url', 'https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/multiservicios-ecologicos-logo.png')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Habilitar RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Cualquier usuario puede leer la configuración del sistema"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo administradores pueden modificar la configuración"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );