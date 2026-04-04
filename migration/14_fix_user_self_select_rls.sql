-- 14_fix_user_self_select_rls.sql
-- Garante que o usuário consiga ler o próprio registro para carregar o perfil, 
-- mesmo estando inativo (essencial para o fluxo de troca de senha).

DROP POLICY IF EXISTS "Usuários podem ler o próprio perfil" ON usuarios;
CREATE POLICY "Usuários podem ler o próprio perfil" ON usuarios 
FOR SELECT 
USING (auth.uid() = id);

-- Reforça que o usuário pode se atualizar durante o reset
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON usuarios;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON usuarios 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
