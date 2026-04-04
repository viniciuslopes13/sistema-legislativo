-- 05_fix_usuarios_id.sql
-- Remove a restrição de chave estrangeira com auth.users para permitir o cadastro simplificado no protótipo
-- E adiciona a geração automática de UUID para a coluna ID.

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_id_fkey;
ALTER TABLE usuarios ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Garante que parlamentares também não falhem se o ID for gerado automaticamente
ALTER TABLE parlamentares DROP CONSTRAINT IF EXISTS parlamentares_id_fkey;
ALTER TABLE parlamentares ADD CONSTRAINT parlamentares_id_fkey FOREIGN KEY (id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Garante que usuario_perfis também não falhem
ALTER TABLE usuario_perfis DROP CONSTRAINT IF EXISTS usuario_perfis_usuario_id_fkey;
ALTER TABLE usuario_perfis ADD CONSTRAINT usuario_perfis_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
