-- 12_fix_management_rls.sql
-- Permite que admins e gestores editem informações

-- 1. Câmaras
DROP POLICY IF EXISTS "Admins podem editar câmaras" ON camaras;
CREATE POLICY "Admins podem editar câmaras" ON camaras 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN usuario_perfis up ON u.id = up.usuario_id
    JOIN perfis p ON up.perfil_id = p.id
    WHERE u.id = auth.uid() AND p.tipo_base = 'ADMIN'
  )
);

-- 2. Usuários
DROP POLICY IF EXISTS "Admins e gestores podem editar usuários" ON usuarios;
CREATE POLICY "Admins e gestores podem editar usuários" ON usuarios 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN usuario_perfis up ON u.id = up.usuario_id
    JOIN perfis p ON up.perfil_id = p.id
    WHERE u.id = auth.uid() AND (p.tipo_base = 'ADMIN' OR (p.tipo_base IN ('PRESIDENTE', 'SECRETARIO') AND p.camara_id = usuarios.camara_id))
  )
);

-- 3. Parlamentares
DROP POLICY IF EXISTS "Admins e gestores podem editar parlamentares" ON parlamentares;
CREATE POLICY "Admins e gestores podem editar parlamentares" ON parlamentares 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN usuario_perfis up ON u.id = up.usuario_id
    JOIN perfis p ON up.perfil_id = p.id
    JOIN usuarios target ON target.id = parlamentares.id
    WHERE u.id = auth.uid() AND (p.tipo_base = 'ADMIN' OR (p.tipo_base IN ('PRESIDENTE', 'SECRETARIO') AND p.camara_id = target.camara_id))
  )
);
