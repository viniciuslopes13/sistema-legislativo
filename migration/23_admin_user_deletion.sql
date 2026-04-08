-- 23_ADMIN_USER_DELETION
-- Implementa fluxo agressivo e limpo para desligamentos e demissões do Legislativo.

CREATE OR REPLACE FUNCTION public.admin_excluir_usuario(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_camara_id UUID;
  v_target_camara_id UUID;
  v_is_global_admin BOOLEAN;
BEGIN
  -- Segurança 1: Verificar se quem mandou executar isso de fato é ao menos Admin de sua própria câmara
  SELECT u.camara_id, EXISTS(
      SELECT 1 FROM public.usuario_perfis up 
      JOIN public.perfis p ON up.perfil_id = p.id 
      WHERE up.usuario_id = auth.uid() AND p.tipo_base = 'ADMIN' AND p.camara_id IS NULL
  )
  INTO v_admin_camara_id, v_is_global_admin
  FROM public.usuarios u WHERE id = auth.uid();

  -- Segurança 2: Limitação Horizontal (Isolamento Inquilino) 
  IF NOT v_is_global_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.usuario_perfis up 
      JOIN public.perfis p ON up.perfil_id = p.id 
      WHERE up.usuario_id = auth.uid() AND p.tipo_base IN ('ADMIN', 'PRESIDENTE')
    ) THEN
      RAISE EXCEPTION 'Acesso Negado: Apenas administradores ou presidentes podem demitir e excluir parlamentares.';
    END IF;

    SELECT camara_id INTO v_target_camara_id FROM public.usuarios WHERE id = p_user_id;
    IF v_target_camara_id != v_admin_camara_id THEN
       RAISE EXCEPTION 'Acesso Negado: Cifrão de Demissão restrito. Este usuário atira contra a base de outra câmara.';
    END IF;
  END IF;

  -- Ação Letal: Deleta o Usuário do Módulo Mestre de Autenticação do Supabase.
  -- NOTA: O PostgreSQL possui ON DELETE CASCADE engatilhado da Auth para o seu Schema Public,
  -- portanto 'usuarios', 'usuario_perfis' e 'parlamentares' serão varridos atomicamente da existência.
  DELETE FROM auth.users WHERE id = p_user_id;

END;
$$;
