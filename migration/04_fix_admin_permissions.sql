-- SGLM - Migração 04: Permissões de Escrita para ADMIN
-- Permite que o Administrador Global crie Câmaras e Usuários.

-- 1. Política para permitir que ADMIN insira novas câmaras
-- Nota: Um ADMIN global tem camara_id IS NULL na tabela de usuários.
CREATE POLICY "ADMIN pode inserir câmaras" ON camaras 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN usuario_perfis up ON u.id = up.usuario_id
    JOIN perfis p ON up.perfil_id = p.id
    WHERE u.id = auth.uid() AND p.tipo_base = 'ADMIN'
  )
);

-- 2. Política para permitir que ADMIN e Mesa Diretora insiram usuários
CREATE POLICY "ADMIN e Mesa podem inserir usuários" ON usuarios
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN usuario_perfis up ON u.id = up.usuario_id
    JOIN perfis p ON up.perfil_id = p.id
    WHERE u.id = auth.uid() AND p.tipo_base IN ('ADMIN', 'PRESIDENTE', 'SECRETARIO')
  )
);

-- 3. Política para permitir inserção de vínculos de perfil
CREATE POLICY "ADMIN e Mesa podem vincular perfis" ON usuario_perfis
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN usuario_perfis up ON u.id = up.usuario_id
    JOIN perfis p ON up.perfil_id = p.id
    WHERE u.id = auth.uid() AND p.tipo_base IN ('ADMIN', 'PRESIDENTE', 'SECRETARIO')
  )
);

-- 4. Política para permitir inserção de dados parlamentares
CREATE POLICY "ADMIN e Mesa podem inserir parlamentares" ON parlamentares
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN usuario_perfis up ON u.id = up.usuario_id
    JOIN perfis p ON up.perfil_id = p.id
    WHERE u.id = auth.uid() AND p.tipo_base IN ('ADMIN', 'PRESIDENTE', 'SECRETARIO')
  )
);
