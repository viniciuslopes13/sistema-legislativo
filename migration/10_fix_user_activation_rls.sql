-- 10_fix_user_activation_rls.sql
-- Garante que o usuário autenticado possa atualizar seu próprio registro na tabela usuarios
-- essencial para o fluxo de ativação (troca de senha)

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON usuarios;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON usuarios 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Garante que a coluna ativo possa ser alterada pelo próprio usuário no primeiro acesso
GRANT UPDATE (ativo, senha_alterada, senha_provisoria) ON usuarios TO authenticated;
