/*
  # Ajustes en la tabla de reparaciones

  1. Cambios
    - Hacer nullable la columna vehicle_id
    - Ajustar la restricción repair_asset_check
    - Optimizar índices para consultas

  2. Razón
    - Permitir crear reparaciones de forma más flexible
    - Mantener la integridad de los datos
    - Mejorar el rendimiento
*/

-- Hacer nullable la columna vehicle_id
ALTER TABLE repairs
ALTER COLUMN vehicle_id DROP NOT NULL;

-- Eliminar la restricción existente si existe
ALTER TABLE repairs 
DROP CONSTRAINT IF EXISTS repair_asset_check;

-- Crear una nueva restricción más flexible
ALTER TABLE repairs
ADD CONSTRAINT repair_asset_check
CHECK (
  -- Permitir que vehicle_id o machine_id esté presente
  -- pero no ambos al mismo tiempo
  NOT (vehicle_id IS NOT NULL AND machine_id IS NOT NULL)
);

-- Optimizar índices para las consultas más comunes
CREATE INDEX IF NOT EXISTS idx_repairs_status_date
ON repairs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repairs_vehicle
ON repairs(vehicle_id)
WHERE vehicle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repairs_machine
ON repairs(machine_id)
WHERE machine_id IS NOT NULL;

-- Refrescar las estadísticas
ANALYZE repairs;