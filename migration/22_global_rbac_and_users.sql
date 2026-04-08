-- 22_GLOBAL_RBAC_AND_USERS.SQL
-- Cria OS PERFIS GLOBAIS do Sistema caso não existam e repassa associação as operações para padronizar os Cargos.

DO $$
DECLARE
  v_admin_id UUID := 'f0000000-0000-0000-0000-000000000000';
  v_pres_id UUID := 'f1111111-1111-1111-1111-111111111111';
  v_secr_id UUID := 'f2222222-2222-2222-2222-222222222222';
  v_vere_id UUID := 'f3333333-3333-3333-3333-333333333333';
  usuario_row RECORD;
  v_perfil_id UUID;
  v_tipo TEXT;
BEGIN
  -- 1. Inserir Perfis de Sistema Globais (camara_id nulo) 
  -- Ignora caso o ID Global já esteja no banco (ON CONFLICT DO NOTHING requer chave unica, entao usaremos Exception handler ou NOT EXISTS)
  
  IF NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = v_admin_id) THEN
    INSERT INTO public.perfis (id, nome, tipo_base, camara_id) VALUES (v_admin_id, 'Administrador Global', 'ADMIN', NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = v_pres_id) THEN
    INSERT INTO public.perfis (id, nome, tipo_base, camara_id) VALUES (v_pres_id, 'Presidente Legislativo', 'PRESIDENTE', NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = v_secr_id) THEN
    INSERT INTO public.perfis (id, nome, tipo_base, camara_id) VALUES (v_secr_id, 'Secretário Parlamentar', 'SECRETARIO', NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = v_vere_id) THEN
    INSERT INTO public.perfis (id, nome, tipo_base, camara_id) VALUES (v_vere_id, 'Vereador Base', 'VEREADOR', NULL);
  END IF;

  -- 2. Limpar associações antigas globais parciais caso hajam (para recriá-las de modo consistente com as Operações Estáticas)
  DELETE FROM public.perfil_operacoes WHERE perfil_id IN (v_admin_id, v_pres_id, v_secr_id, v_vere_id);

  -- 3. Vincular Operações do Sistema a cada Perfil Base (RBAC Mapping)
  
  -- ADMIN e Presidente ganham todas as operações cadastradas na base de dados
  INSERT INTO public.perfil_operacoes (perfil_id, operacao_id) SELECT v_admin_id, id FROM public.operacoes;
  INSERT INTO public.perfil_operacoes (perfil_id, operacao_id) SELECT v_pres_id, id FROM public.operacoes;

  -- Secretário Parlamentar assume Avanço de Ritos da Sessão, Lançamentos e Presenças
  INSERT INTO public.perfil_operacoes (perfil_id, operacao_id)
  SELECT v_secr_id, id FROM public.operacoes WHERE codigo IN ('SESSAO_AVANCAR', 'VOTACAO_INICIAR', 'VOTACAO_ENCERRAR', 'PRESENCA_REGISTRAR');

  -- Vereador Convencional opera Presença e seu respectivo Voto
  INSERT INTO public.perfil_operacoes (perfil_id, operacao_id)
  SELECT v_vere_id, id FROM public.operacoes WHERE codigo IN ('VOTAR', 'PRESENCA_REGISTRAR');

  -- 4. BACKFILL: Resgatar Usuários Órfãos e Vinculá-los aos Perfils recém-criados.
  -- Procura usuários que existem mas que sofreram o erro de não ganharem perfil na tabela conector 'usuario_perfis'
  FOR usuario_row IN
    SELECT u.id, u.camara_id, COALESCE(p.cargo_mesa, 'VEREADOR') as sugestao
    FROM public.usuarios u
    LEFT JOIN public.parlamentares p ON u.id = p.id
    WHERE NOT EXISTS (SELECT 1 FROM public.usuario_perfis up WHERE up.usuario_id = u.id)
  LOOP
    -- Faz o Fallback com match exato baseado na análise visual do Painel
    IF usuario_row.sugestao ILIKE '%Presidente%' THEN 
      v_perfil_id := v_pres_id;
    ELSIF usuario_row.sugestao ILIKE '%Secretário%' THEN 
      v_perfil_id := v_secr_id;
    ELSIF usuario_row.sugestao ILIKE '%Admin%' OR (usuario_row.sugestao IS NULL AND usuario_row.camara_id IS NULL) THEN
      -- Se nem tem camara nem cargo, joga como sysadmin.
      v_perfil_id := v_admin_id;
    ELSE 
      v_perfil_id := v_vere_id; 
    END IF;

    -- Vincula o usuário desgarrado ao perfil global do RBAC.
    INSERT INTO public.usuario_perfis (usuario_id, perfil_id) VALUES (usuario_row.id, v_perfil_id);
  END LOOP;
END
$$;
