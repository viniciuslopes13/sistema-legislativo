-- SGLM - ESTRUTURA CONSOLIDADA E OTIMIZADA FINAL
-- Este script limpa toda a base e recria a estrutura final e livre de gambiarras/overlaps.
-- Ideal para subir novos tenants/clientes ou restaurar ambiente de homologação.

-- 0. LIMPEZA SEGURA (Cuidado: apaga dados!)
DROP TABLE IF EXISTS votos, votacoes, itens_pauta, presencas, sessoes, configuracao_fases, templates_rito CASCADE;
DROP TABLE IF EXISTS parlamentares, usuario_perfis, perfil_operacoes, operacoes, perfis, usuarios, camaras CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ESTRUTURA CORE & MULTI-TENANCY
CREATE TABLE camaras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  logo_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SEGURANÇA & PERFIS (RBAC PURO)
CREATE TABLE perfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  tipo_base TEXT NOT NULL CHECK (tipo_base IN ('PRESIDENTE', 'SECRETARIO', 'VEREADOR', 'ADMIN')),
  camara_id UUID REFERENCES camaras(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE operacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL, 
  descricao TEXT
);

CREATE TABLE perfil_operacoes (
  perfil_id UUID REFERENCES perfis(id) ON DELETE CASCADE,
  operacao_id UUID REFERENCES operacoes(id) ON DELETE CASCADE,
  PRIMARY KEY (perfil_id, operacao_id)
);

-- 3. USUÁRIOS & PARLAMENTARES
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  ativo BOOLEAN DEFAULT true,
  camara_id UUID REFERENCES camaras(id) ON DELETE SET NULL,
  senha_alterada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usuario_perfis (
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES perfis(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, perfil_id)
);

CREATE TABLE parlamentares (
  id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  partido TEXT NOT NULL,
  cargo_mesa TEXT,
  foto_url TEXT,
  is_suplente BOOLEAN DEFAULT false,
  em_exercicio BOOLEAN DEFAULT true
);

-- 4. GESTÃO DE RITO (TEMPLATES)
CREATE TABLE templates_rito (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camara_id UUID REFERENCES camaras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL
);

CREATE TABLE configuracao_fases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates_rito(id) ON DELETE CASCADE,
  nome_fase TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  tempo_cronometro INTEGER DEFAULT 0,
  permite_votacao BOOLEAN DEFAULT false,
  exige_quorum_minimo BOOLEAN DEFAULT true,
  percentual_quorum FLOAT DEFAULT 0.33
);

-- 5. EXECUÇÃO DA SESSÃO E DELIBERAÇÃO
CREATE TABLE sessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camara_id UUID REFERENCES camaras(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates_rito(id) ON DELETE SET NULL,
  data_inicio TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('AGUARDANDO', 'EM_CURSO', 'SUSPENSA', 'FINALIZADA')) DEFAULT 'AGUARDANDO',
  fase_indice_atual INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE presencas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessao_id UUID REFERENCES sessoes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now(),
  manual BOOLEAN DEFAULT false
);

CREATE TABLE itens_pauta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessao_id UUID REFERENCES sessoes(id) ON DELETE CASCADE,
  titulo_manual TEXT NOT NULL,
  ementa_manual TEXT,
  ordem INTEGER NOT NULL,
  id_referencia_tramitacao UUID,
  tipo_materia TEXT CHECK (tipo_materia IN ('PL', 'VETO', 'REQUERIMENTO')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE votacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES itens_pauta(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('NAO_INICIADA', 'DISCUSSAO', 'VOTANDO', 'CONCLUIDA', 'ANULADA')) DEFAULT 'NAO_INICIADA',
  tipo_quorum TEXT CHECK (tipo_quorum IN ('MAIORIA_SIMPLES', 'MAIORIA_ABSOLUTA', 'DOIS_TERCOS')) DEFAULT 'MAIORIA_SIMPLES',
  hora_inicio TIMESTAMPTZ,
  hora_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE votos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  votacao_id UUID REFERENCES votacoes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  opcao TEXT NOT NULL CHECK (opcao IN ('SIM', 'NAO', 'ABSTER')),
  is_voto_minerva BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now(),
  UNIQUE(votacao_id, usuario_id)
);

-- ==========================================
-- = 6. POLÍTICAS DE RLS CONSOLIDADAS FINAL =
-- ==========================================

-- HELPER ANTI-RECURSÃO PARA RLS (SECURITY DEFINER)
-- Retorna a camara_id embutida silenciosamente para checar multitenancy sem joins custosos
CREATE OR REPLACE FUNCTION auth.minha_camara() RETURNS UUID AS $$
  SELECT camara_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.eu_sou_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    JOIN public.perfil_operacoes po ON p.id = po.perfil_id
    JOIN public.operacoes o ON po.operacao_id = o.id
    WHERE up.usuario_id = auth.uid() AND o.codigo = 'SISTEMA_ADMINISTRAR_TENANTS'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ATIVANDO RLS EM TODAS AS TABELAS
ALTER TABLE camaras ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_operacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE parlamentares ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_rito ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pauta ENABLE ROW LEVEL SECURITY;
ALTER TABLE votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;

-- 6.1 CAMARAS
CREATE POLICY "Admins globais vêem tudo, usuários vêem a sua" ON camaras
FOR SELECT USING (auth.eu_sou_admin() OR id = auth.minha_camara());
CREATE POLICY "Admins gerenciam camaras" ON camaras
FOR ALL USING (auth.eu_sou_admin());

-- 6.2 USUÁRIOS E PARLAMENTARES
CREATE POLICY "Leitura de usuários dentro do tenant" ON usuarios
FOR SELECT USING (auth.eu_sou_admin() OR camara_id = auth.minha_camara());
CREATE POLICY "Gestão de usuários" ON usuarios
FOR ALL USING (auth.eu_sou_admin() OR (camara_id = auth.minha_camara() AND auth.uid() IN (
    SELECT usuario_id FROM public.usuario_perfis up JOIN public.perfil_operacoes po ON up.perfil_id = po.perfil_id 
    JOIN public.operacoes o ON po.operacao_id = o.id WHERE o.codigo = 'GERENCIAR_USUARIOS_E_CAMARAS'
)));

CREATE POLICY "Leitura parlamentares tenant" ON parlamentares
FOR SELECT USING (EXISTS (SELECT 1 FROM usuarios WHERE usuarios.id = parlamentares.id AND (usuarios.camara_id = auth.minha_camara() OR auth.eu_sou_admin())));
CREATE POLICY "Gestão parlamentares" ON parlamentares
FOR ALL USING (auth.eu_sou_admin() OR EXISTS (
    SELECT 1 FROM usuarios WHERE usuarios.id = parlamentares.id AND usuarios.camara_id = auth.minha_camara() AND auth.uid() IN (
      SELECT usuario_id FROM public.usuario_perfis up JOIN public.perfil_operacoes po ON up.perfil_id = po.perfil_id 
      JOIN public.operacoes o ON po.operacao_id = o.id WHERE o.codigo = 'GERENCIAR_USUARIOS_E_CAMARAS'
)));

-- 6.3 VOTAÇÕES E VOTOS
CREATE POLICY "Ver votos do tenant" ON votos
FOR SELECT USING (true); -- Controle real feito na view/UI pois o Realtime precisa ler tudo
CREATE POLICY "Inserir próprio voto" ON votos
FOR INSERT WITH CHECK (usuario_id = auth.uid()); -- Proteção Rígida: Só pode inserir usando próprio UID

-- 6.4 DEMAIS ENTIDADES DO LEGISLATIVO (Leitura liberada, restrição baseada em Sessão/UI)
CREATE POLICY "Leitura irrestrita de sessoes para usuários logados" ON sessoes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Ações em sessoes" ON sessoes FOR ALL USING (auth.eu_sou_admin() OR camara_id = auth.minha_camara());

-- Ativação GERAL do Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE usuarios, parlamentares, perfil_operacoes, usuario_perfis, camaras, sessoes, itens_pauta, votacoes, votos, presencas;

-- 7. SEED DOS DADOS CORE DE GESTÃO (OPERAÇÕES DEFINITIVAS)
INSERT INTO operacoes (codigo, descricao) VALUES
    ('PAINEL_VISUALIZAR', 'Acesso básico de visualização à dashboard principal'),
    ('SESSAO_GERENCIAR', 'Acesso ao Console Avançado da Presidência'),
    ('SESSAO_ENCERRAR', 'Capacidade para derrubada de Sessão Ativa'),
    ('SESSAO_AGENDAR', 'Agendar uma sessão na agenda institucional'),
    ('VOTACAO_INICIAR', 'Iniciar votação de matéria'),
    ('VOTAR', 'Registrar voto em matéria'),
    ('GERENCIAR_USUARIOS_E_CAMARAS', 'Acesso completo à gestão de usuários'),
    ('SISTEMA_CONFIGURAR', 'Acesso à infra de configurações e ritos'),
    ('SISTEMA_ADMINISTRAR_TENANTS', 'Habilidade Cross-Câmara - SuperAdmin');
