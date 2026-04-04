-- SGLM - Migração 02: Configuração de Administrador Global
-- Este script configura o perfil de Admin Geral e prepara a vinculação do seu usuário.

-- 1. Criar o Perfil de Administrador Global (camara_id NULL para controle total)
INSERT INTO perfis (id, nome, tipo_base, camara_id)
VALUES ('f0000000-0000-0000-0000-000000000000', 'Administrador Global', 'ADMIN', NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. Garantir que este perfil tenha todas as operações permitidas
INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT 'f0000000-0000-0000-0000-000000000000', id FROM operacoes
ON CONFLICT DO NOTHING;

-- 3. Função para elevar seu usuário a ADMIN assim que ele for detectado no sistema
-- Nota: Você ainda precisa se cadastrar na tela de Login (ou via Dashboard do Supabase)
-- para que o registro exista em 'auth.users'.

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Tenta buscar o ID do usuário pelo e-mail
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'franciscoviniciuslopescosta@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Insere na tabela de usuários do sistema
    INSERT INTO usuarios (id, nome, email, camara_id, ativo)
    VALUES (v_user_id, 'Vinícius Lopes (Admin)', 'franciscoviniciuslopescosta@gmail.com', NULL, true)
    ON CONFLICT (id) DO UPDATE SET camara_id = NULL;

    -- Vincula ao perfil de Administrador Global
    INSERT INTO usuario_perfis (usuario_id, perfil_id)
    VALUES (v_user_id, 'f0000000-0000-0000-0000-000000000000')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Usuário franciscoviniciuslopescosta@gmail.com elevado a ADMIN GLOBAL com sucesso.';
  ELSE
    RAISE NOTICE 'Usuário não encontrado em auth.users. Por favor, cadastre-se primeiro no App ou Dashboard.';
  END IF;
END $$;
