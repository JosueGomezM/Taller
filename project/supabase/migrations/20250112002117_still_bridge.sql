/*
  # Actualización de políticas de usuarios y roles

  1. Cambios en políticas
    - Actualizar políticas de usuarios para permitir gestión solo a administradores
    - Restringir acceso de mecánicos solo a la sección de reparaciones

  2. Nuevas políticas
    - Permitir a administradores crear y gestionar usuarios
    - Permitir a mecánicos ver y actualizar su propio perfil
*/

-- Eliminar políticas existentes de usuarios
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Crear nuevas políticas para la tabla users
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can read their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));