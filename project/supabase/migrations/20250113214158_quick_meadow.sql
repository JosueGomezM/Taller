/*
  # Actualización del esquema para soportar reparaciones de máquinas

  1. Verificación de columnas existentes
  2. Actualización de constraints
  3. Creación de índices
*/

-- Verificar si la columna machine_id ya existe antes de intentar crearla
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'repairs' 
    AND column_name = 'machine_id'
  ) THEN
    -- Agregar la columna machine_id si no existe
    ALTER TABLE repairs
    ADD COLUMN machine_id uuid REFERENCES machines(id);
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_repairs_machine_id
ON repairs(machine_id);

CREATE INDEX IF NOT EXISTS idx_repairs_vehicle_machine_status
ON repairs(
  COALESCE(vehicle_id, machine_id),
  status
);

-- Asegurar que una reparación tenga un vehículo O una máquina, pero no ambos o ninguno
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'repair_asset_check'
  ) THEN
    ALTER TABLE repairs
    ADD CONSTRAINT repair_asset_check
    CHECK (
      (vehicle_id IS NOT NULL AND machine_id IS NULL) OR
      (vehicle_id IS NULL AND machine_id IS NOT NULL)
    );
  END IF;
END $$;

-- Actualizar las políticas existentes
DROP POLICY IF EXISTS "Authenticated users can read repairs" ON repairs;
DROP POLICY IF EXISTS "Authenticated users can manage repairs" ON repairs;

-- Crear nuevas políticas
CREATE POLICY "Authenticated users can read repairs"
  ON repairs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage repairs"
  ON repairs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);