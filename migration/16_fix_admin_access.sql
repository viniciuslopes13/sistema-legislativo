-- 16_FIX ADMIN ACCESS
-- Corrige o acesso para Administradores Globais e usuários sem camara_id vinculada (NULL).

-- 1. MELHORIA NA FUNÇÃO DE VERIFICAÇÃO DE ADMIN
CREATE OR REPLACE FUNCTION public.usuario_e_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.usuario_id = auth.uid() AND p.tipo_base = 'ADMIN'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. AJUSTE NAS POLÍTICAS DE ISOLAMENTO (PERMITIR ADMIN VER TUDO)

-- Sessoes
DROP POLICY IF EXISTS "Isolamento de Sessões por Câmara" ON sessoes;
CREATE POLICY "Acesso de Sessões: Câmara ou Admin" ON sessoes 
FOR SELECT USING (
  camara_id = public.obter_minha_camara() OR public.usuario_e_admin()
);

-- Itens da Pauta
DROP POLICY IF EXISTS "Isolamento de Itens de Pauta" ON itens_pauta;
CREATE POLICY "Acesso de Itens: Câmara ou Admin" ON itens_pauta 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sessoes s 
    WHERE s.id = itens_pauta.sessao_id 
    AND (s.camara_id = public.obter_minha_camara() OR public.usuario_e_admin())
  )
);

-- Votacoes
DROP POLICY IF EXISTS "Isolamento de Votações" ON votacoes;
CREATE POLICY "Acesso de Votações: Câmara ou Admin" ON votacoes 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.itens_pauta ip
    JOIN public.sessoes s ON ip.sessao_id = s.id
    WHERE ip.id = votacoes.item_id 
    AND (s.camara_id = public.obter_minha_camara() OR public.usuario_e_admin())
  )
);

-- 3. AJUSTE NA TABELA DE PERFIS (GARANTIR CARREGAMENTO INICIAL)
-- Garante que o usuário consiga ler seus próprios perfis para descobrir que é ADMIN
DROP POLICY IF EXISTS "Proteção de Perfis: Apenas Gestores" ON usuario_perfis;
CREATE POLICY "Leitura de Perfis: Próprio ou Gestor" ON usuario_perfis 
FOR SELECT USING (
  usuario_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.usuario_perfis up_admin
    JOIN public.perfis p ON up_admin.perfil_id = p.id
    WHERE up_admin.usuario_id = auth.uid() 
    AND p.tipo_base IN ('ADMIN', 'PRESIDENTE', 'SECRETARIO')
  )
);

-- 4. AJUSTE NA TABELA DE USUÁRIOS (GARANTIR LEITURA DO PERFIL)
DROP POLICY IF EXISTS "Usuários podem ler o próprio perfil" ON usuarios;
CREATE POLICY "Leitura de Usuário: Próprio ou Admin" ON usuarios 
FOR SELECT USING (
  id = auth.uid() OR public.usuario_e_admin()
);
