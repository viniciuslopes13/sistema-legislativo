-- 08_remove_senha_real.sql
ALTER TABLE usuarios DROP COLUMN IF EXISTS senha_real;
