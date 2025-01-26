/*
  # Optimización de índices para mejor rendimiento

  1. Índices
    - Índice compuesto para repairs por status y fecha
    - Índice compuesto para repairs por mecánico y status
    - Índice para comentarios por status y fecha
    - Índice único para código de vehículos
*/

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_repairs_status_created 
ON repairs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_repairs_mechanic_status 
ON repairs(mechanic_id, status);

CREATE INDEX IF NOT EXISTS idx_repair_comments_status 
ON repair_comments(status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_code 
ON vehicles(code);

-- Refrescar las estadísticas de las tablas
ANALYZE users;
ANALYZE vehicles;
ANALYZE repairs;
ANALYZE repair_comments;