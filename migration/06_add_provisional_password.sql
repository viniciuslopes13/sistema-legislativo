-- 06_add_provisional_password.sql
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_provisoria TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_alterada BOOLEAN DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_real TEXT; -- Para o protótipo, simularemos o auth.users aqui
