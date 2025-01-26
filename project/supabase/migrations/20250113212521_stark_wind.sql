/*
  # Agregar tabla de máquinas y funcionalidad relacionada

  1. Nueva Tabla
    - `machines`
      - `id` (uuid, primary key)
      - `code` (text, generado automáticamente)
      - `plant` (text, planta a la que pertenece)
      - `name` (text, nombre de la máquina)
      - `serial_number` (text, número de serie)
      - `created_at` (timestamp)

  2. Función para generar códigos automáticos
    - Genera códigos incrementales con formato MAQ-XXXX

  3. Trigger para asignar códigos automáticamente
    - Se ejecuta antes de insertar un nuevo registro
*/

-- Crear la tabla de máquinas
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plant text NOT NULL,
  name text NOT NULL,
  serial_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Crear secuencia para los códigos
CREATE SEQUENCE IF NOT EXISTS machine_code_seq START 1;

-- Función para generar el código automático
CREATE OR REPLACE FUNCTION generate_machine_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := 'MAQ-' || LPAD(nextval('machine_code_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asignar el código automáticamente
CREATE TRIGGER set_machine_code
  BEFORE INSERT ON machines
  FOR EACH ROW
  EXECUTE FUNCTION generate_machine_code();

-- Habilitar RLS
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Cualquier usuario autenticado puede leer máquinas"
  ON machines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar máquinas"
  ON machines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_machines_code 
ON machines(code);

CREATE INDEX IF NOT EXISTS idx_machines_plant 
ON machines(plant);