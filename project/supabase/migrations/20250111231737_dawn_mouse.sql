/*
  # Actualizar políticas de seguridad para vehículos

  1. Cambios
    - Modificar la política existente para permitir a usuarios autenticados crear y gestionar vehículos
    - Mantener la capacidad de lectura para todos los usuarios autenticados

  2. Seguridad
    - Mantiene RLS habilitado
    - Permite operaciones CRUD para usuarios autenticados
*/

-- Eliminar la política anterior que solo permitía a los administradores
DROP POLICY IF EXISTS "Admins can manage vehicles" ON vehicles;

-- Crear nueva política que permite a usuarios autenticados gestionar vehículos
CREATE POLICY "Authenticated users can manage vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);