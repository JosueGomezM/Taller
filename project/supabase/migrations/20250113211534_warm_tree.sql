/*
  # Actualizar tipos de vehículos

  1. Cambios
    - Actualizar el tipo enum vehicle_type para incluir las nuevas opciones
    - Convertir los vehículos existentes de tipo 'machinery' a 'equipment'

  2. Notas
    - Se mantiene la compatibilidad con los registros existentes
    - Se realiza una migración segura de los datos
*/

-- Crear un nuevo tipo enum con los valores actualizados
CREATE TYPE vehicle_type_new AS ENUM ('truck', 'vehicle', 'equipment');

-- Convertir la columna type a text temporalmente
ALTER TABLE vehicles ALTER COLUMN type TYPE text;

-- Actualizar los valores existentes
UPDATE vehicles 
SET type = CASE 
  WHEN type = 'machinery' THEN 'equipment'
  ELSE type 
END;

-- Eliminar el tipo enum anterior
DROP TYPE vehicle_type;

-- Renombrar el nuevo tipo
ALTER TYPE vehicle_type_new RENAME TO vehicle_type;

-- Convertir la columna de nuevo a enum
ALTER TABLE vehicles 
  ALTER COLUMN type TYPE vehicle_type 
  USING type::vehicle_type;

-- Asegurar que la columna no sea nula
ALTER TABLE vehicles 
  ALTER COLUMN type SET NOT NULL;