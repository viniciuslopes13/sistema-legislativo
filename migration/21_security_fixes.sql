-- 21_SECURITY_FIXES
-- Implementa diversas correções recomendáveis para sanar vulnerabilidades.

-- 1. Habilita a extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Remoção da coluna de senha_provisoria (Exposta para Leitura)
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS senha_provisoria;

-- 3. Função RPC para Administradores resetarem a senha de forma totalmente segura e hasheada na tabela isolada de auth
CREATE OR REPLACE FUNCTION public.admin_resetar_senha(p_user_id UUID, p_nova_senha TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_camara_id UUID;
  v_target_camara_id UUID;
  v_is_global_admin BOOLEAN;
BEGIN
  -- Verificar se o requisitante (quem executa) é admin
  SELECT u.camara_id, EXISTS(
      SELECT 1 FROM public.usuario_perfis up 
      JOIN public.perfis p ON up.perfil_id = p.id 
      WHERE up.usuario_id = auth.uid() AND p.tipo_base = 'ADMIN' AND p.camara_id IS NULL
  )
  INTO v_admin_camara_id, v_is_global_admin
  FROM public.usuarios u WHERE id = auth.uid();

  -- Se não for admin global, verificar se tem permissões administrativas na mesma câmara
  IF NOT v_is_global_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.usuario_perfis up 
      JOIN public.perfis p ON up.perfil_id = p.id 
      WHERE up.usuario_id = auth.uid() AND p.tipo_base IN ('ADMIN', 'PRESIDENTE')
    ) THEN
      RAISE EXCEPTION 'Acesso Negado: Apenas administradores ou presidentes podem resetar senhas.';
    END IF;

    SELECT camara_id INTO v_target_camara_id FROM public.usuarios WHERE id = p_user_id;
    IF v_target_camara_id != v_admin_camara_id THEN
       RAISE EXCEPTION 'Acesso Negado: Usuário pertence a outra câmara.';
    END IF;
  END IF;

  -- Atualizar a senha diretamente na tabela do Supabase Auth, utilizando o formato bcrypt (bf)
  UPDATE auth.users 
  SET encrypted_password = crypt(p_nova_senha, gen_salt('bf'))
  WHERE id = p_user_id;

  -- Sinalizar na tabela de usuários que ele precisará alterar a senha no respectivo próximo login (primeiro acesso real)
  UPDATE public.usuarios SET senha_alterada = false, ativo = true WHERE id = p_user_id;
END;
$$;

-- 4. Exclusão de Política de Segurança permissiva que expunha e-mails e senhas de forma pública
DROP POLICY IF EXISTS "Leitura pública limitada de usuários" ON public.usuarios;

-- 5. RPC Restrito para que o endpoint público (após remover a RLS acima) possa ver os dados mínimos para os quóruns, SEM expor e-mails ou números
CREATE OR REPLACE FUNCTION public.obter_parlamentares_publicos(p_camara_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', u.id,
      'nome', u.nome,
      'ativo', u.ativo,
      'camara_id', u.camara_id,
      'partido', p.partido,
      'cargo_mesa', p.cargo_mesa,
      'foto_url', p.foto_url
    )
  ), '[]'::jsonb)
  FROM public.usuarios u
  JOIN public.parlamentares p ON u.id = p.id
  WHERE u.camara_id = p_camara_id
    AND EXISTS (
      SELECT 1 FROM public.usuario_perfis up
      JOIN public.perfis per ON up.perfil_id = per.id
      WHERE up.usuario_id = u.id AND per.tipo_base IN ('VEREADOR', 'PRESIDENTE', 'SECRETARIO')
    );
$$;

-- 6. Refinamentos Avançados em Votos: Verificações de Permissão baseadas diretamente no Banco
DROP POLICY IF EXISTS "Voto Protegido: Apenas em nome próprio" ON public.votos;
CREATE POLICY "Voto Protegido: Apenas em nome próprio e com permissão" ON public.votos 
FOR INSERT WITH CHECK (
  usuario_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = auth.uid() AND u.ativo = true AND u.camara_id = (
      SELECT s.camara_id FROM public.votacoes v
      JOIN public.itens_pauta ip ON v.item_id = ip.id
      JOIN public.sessoes s ON ip.sessao_id = s.id
      WHERE v.id = votos.votacao_id
    )
  ) AND
  EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    JOIN public.perfil_operacoes po ON po.perfil_id = p.id
    JOIN public.operacoes o ON o.id = po.operacao_id
    WHERE up.usuario_id = auth.uid() AND o.codigo = 'VOTAR'
  )
);

DROP POLICY IF EXISTS "Voto Protegido: Edição apenas própria" ON public.votos;
CREATE POLICY "Voto Protegido: Edição apenas própria e com permissão" ON public.votos 
FOR UPDATE USING (
  usuario_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    JOIN public.perfil_operacoes po ON po.perfil_id = p.id
    JOIN public.operacoes o ON o.id = po.operacao_id
    WHERE up.usuario_id = auth.uid() AND o.codigo = 'VOTAR'
  )
);
