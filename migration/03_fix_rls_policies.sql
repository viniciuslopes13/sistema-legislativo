-- SGLM - Migração 03: Correção de Políticas RLS e Permissões
-- Este script libera a leitura de perfis e parlamentares para usuários autenticados.

-- 1. Permitir leitura de perfis e operações
CREATE POLICY "Leitura de perfis para usuários autenticados" ON perfis FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de operações para usuários autenticados" ON operacoes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de vínculos perfil-operação" ON perfil_operacoes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura de vínculos usuário-perfil" ON usuario_perfis FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Permitir leitura de dados parlamentares
CREATE POLICY "Leitura pública de parlamentares" ON parlamentares FOR SELECT USING (true);

-- 3. Garantir que a tabela de usuários tenha política de leitura correta
-- (Removendo a anterior se existir para evitar duplicação)
DROP POLICY IF EXISTS "Usuários podem ver perfis da sua câmara" ON usuarios;
CREATE POLICY "Leitura de usuários para autenticados" ON usuarios FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Adicionar política para permitir que Administradores Globais vejam tudo (exemplo de expansão)
-- Nota: Como o sistema é multi-tenant, o ADMIN GLOBAL (camara_id IS NULL) deve ter acesso amplo.
