-- Eliminar la restricción existente
ALTER TABLE repairs DROP CONSTRAINT IF EXISTS repair_asset_check;

-- Crear una nueva restricción más flexible
ALTER TABLE repairs
ADD CONSTRAINT repair_asset_check
CHECK (
  -- Permitir que vehicle_id o machine_id esté presente
  -- pero no ambos al mismo tiempo
  NOT (vehicle_id IS NOT NULL AND machine_id IS NOT NULL)
);

-- Actualizar la columna vehicle_id para permitir nulos
ALTER TABLE repairs
ALTER COLUMN vehicle_id DROP NOT NULL;

-- Crear índices para optimizar las consultas
CREATE INDEX IF NOT EXISTS idx_repairs_combined_status
ON repairs(
  COALESCE(vehicle_id::text, machine_id::text),
  status,
  created_at DESC
);

-- Refrescar las estadísticas
ANALYZE repairs;