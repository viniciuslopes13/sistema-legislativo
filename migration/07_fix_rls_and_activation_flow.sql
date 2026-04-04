-- 07_fix_rls_and_activation_flow.sql

-- 1. Permitir que qualquer um consulte se um e-mail existe e sua senha provisória 
-- (necessário para o fluxo de primeiro acesso antes do login)
DROP POLICY IF EXISTS "Leitura de usuários para autenticados" ON usuarios;
DROP POLICY IF EXISTS "Leitura pública limitada de usuários" ON usuarios;
CREATE POLICY "Leitura pública limitada de usuários" ON usuarios 
FOR SELECT USING (true);

-- 2. Limpeza e Restrição de Integridade
-- Primeiro, removemos a constraint se ela já existir para evitar erros
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_id_fkey;

-- REMOÇÃO DE USUÁRIOS ÓRFÃOS:
-- Deletamos registros em 'usuarios' que não possuem um ID correspondente em 'auth.users'
DELETE FROM usuarios WHERE id NOT IN (SELECT id FROM auth.users);

-- Agora podemos adicionar a constraint com segurança
ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Ajustar default de ativo para false
ALTER TABLE usuarios ALTER COLUMN ativo SET DEFAULT false;

-- 4. Remover o valor padrão de UUID aleatório (agora o ID deve vir sempre do Auth)
ALTER TABLE usuarios ALTER COLUMN id DROP DEFAULT;
