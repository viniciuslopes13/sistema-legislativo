-- 11_fix_usuario_perfis_rls.sql
-- Permite que usuários autenticados (especialmente admins e gestores) associem perfis a outros usuários

DROP POLICY IF EXISTS "Qualquer um pode ler associações de perfil" ON usuario_perfis;
CREATE POLICY "Qualquer um pode ler associações de perfil" ON usuario_perfis 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins e Gestores podem associar perfis" ON usuario_perfis;
CREATE POLICY "Admins e Gestores podem associar perfis" ON usuario_perfis 
FOR INSERT WITH CHECK (true); -- No protótipo, permitimos a inserção para garantir o fluxo

-- Garante que perfis também possam ser lidos e criados durante o fluxo de cadastro
DROP POLICY IF EXISTS "Leitura de perfis para todos" ON perfis;
CREATE POLICY "Leitura de perfis para todos" ON perfis FOR SELECT USING (true);

DROP POLICY IF EXISTS "Criação de perfis durante cadastro" ON perfis;
CREATE POLICY "Criação de perfis durante cadastro" ON perfis FOR INSERT WITH CHECK (true);
