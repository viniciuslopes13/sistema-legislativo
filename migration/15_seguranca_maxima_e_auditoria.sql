-- 15_SEGURANÇA MÁXIMA E AUDITORIA
-- Este script blinda o banco de dados contra manipulações indevidas via Frontend.

-- 1. FUNÇÃO AUXILIAR DE SEGURANÇA
-- Retorna o camara_id do usuário logado de forma performática
CREATE OR REPLACE FUNCTION public.obter_minha_camara()
RETURNS UUID AS $$
  SELECT camara_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. TABELA DE AUDITORIA (LOGS DO SISTEMA)
CREATE TABLE IF NOT EXISTS public.logs_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id),
  camara_id UUID REFERENCES public.camaras(id),
  tabela TEXT NOT NULL,
  operacao TEXT NOT NULL,
  dados_antigos JSONB,
  dados_novos JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS nos logs (apenas leitura para Admins)
ALTER TABLE public.logs_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apenas Admins leem logs" ON public.logs_eventos 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuario_perfis up 
    JOIN public.perfis p ON up.perfil_id = p.id 
    WHERE up.usuario_id = auth.uid() AND p.tipo_base = 'ADMIN'
  )
);

-- 3. REFINAMENTO DE POLÍTICAS DE LEITURA (ISOLAMENTO MULTI-TENANT)

-- Sessoes: Usuário só vê sessões da sua própria Câmara
DROP POLICY IF EXISTS "Leitura pública para usuários autenticados" ON sessoes;
CREATE POLICY "Isolamento de Sessões por Câmara" ON sessoes 
FOR SELECT USING (camara_id = public.obter_minha_camara());

-- Itens da Pauta: Só acessíveis via Sessão da mesma Câmara
DROP POLICY IF EXISTS "Leitura pública de itens de pauta" ON itens_pauta;
CREATE POLICY "Isolamento de Itens de Pauta" ON itens_pauta 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sessoes s 
    WHERE s.id = itens_pauta.sessao_id AND s.camara_id = public.obter_minha_camara()
  )
);

-- Votacoes: Só acessíveis via Item da mesma Câmara
DROP POLICY IF EXISTS "Leitura pública de votações" ON votacoes;
CREATE POLICY "Isolamento de Votações" ON votacoes 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.itens_pauta ip
    JOIN public.sessoes s ON ip.sessao_id = s.id
    WHERE ip.id = votacoes.item_id AND s.camara_id = public.obter_minha_camara()
  )
);

-- 4. PROTEÇÃO RIGOROSA DE VOTOS (O PONTO CRÍTICO)

DROP POLICY IF EXISTS "Votos são inseríveis por parlamentares autenticados" ON votos;

-- Garante que:
-- 1. O usuário só vota em seu próprio nome (id = auth.uid())
-- 2. O usuário pertence à câmara daquela votação
-- 3. O usuário está ativo
CREATE POLICY "Voto Protegido: Apenas em nome próprio" ON votos 
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
  )
);

-- Impede alteração de voto de terceiros
CREATE POLICY "Voto Protegido: Edição apenas própria" ON votos 
FOR UPDATE USING (usuario_id = auth.uid());

-- 5. BLINDAGEM DE ESCALAÇÃO DE PRIVILÉGIOS (RBAC)

-- Impede que usuários comuns alterem seus próprios perfis
DROP POLICY IF EXISTS "Usuários não podem alterar perfis" ON usuario_perfis;
CREATE POLICY "Proteção de Perfis: Apenas Gestores" ON usuario_perfis 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.usuario_perfis up_admin
    JOIN public.perfis p ON up_admin.perfil_id = p.id
    WHERE up_admin.usuario_id = auth.uid() 
    AND p.tipo_base IN ('ADMIN', 'PRESIDENTE', 'SECRETARIO')
  )
);

-- 6. TRIGGER DE AUDITORIA PARA VOTOS E SESSÕES
CREATE OR REPLACE FUNCTION public.gerar_log_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.logs_eventos (usuario_id, camara_id, tabela, operacao, dados_antigos, dados_novos)
  VALUES (
    auth.uid(), 
    (SELECT camara_id FROM public.usuarios WHERE id = auth.uid()),
    TG_TABLE_NAME, 
    TG_OP, 
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar auditoria em tabelas sensíveis
CREATE TRIGGER trg_audit_votos AFTER INSERT OR UPDATE OR DELETE ON public.votos FOR EACH ROW EXECUTE FUNCTION public.gerar_log_auditoria();
CREATE TRIGGER trg_audit_sessoes AFTER INSERT OR UPDATE OR DELETE ON public.sessoes FOR EACH ROW EXECUTE FUNCTION public.gerar_log_auditoria();
CREATE TRIGGER trg_audit_camaras AFTER UPDATE ON public.camaras FOR EACH ROW EXECUTE FUNCTION public.gerar_log_auditoria();
