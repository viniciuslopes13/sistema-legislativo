-- SGLM - Migração Completa: Reset e Reconstrução (CORRIGIDA)
-- Este script limpa toda a base e recria a estrutura final baseada na especificação técnica.

-- 0. LIMPEZA TOTAL (Cuidado: apaga todos os dados!)
DROP TABLE IF EXISTS votos CASCADE;
DROP TABLE IF EXISTS votacoes CASCADE;
DROP TABLE IF EXISTS itens_pauta CASCADE;
DROP TABLE IF EXISTS presencas CASCADE;
DROP TABLE IF EXISTS sessoes CASCADE;
DROP TABLE IF EXISTS configuracao_fases CASCADE;
DROP TABLE IF EXISTS templates_rito CASCADE;
DROP TABLE IF EXISTS parlamentares CASCADE;
DROP TABLE IF EXISTS usuario_perfis CASCADE;
DROP TABLE IF EXISTS perfil_operacoes CASCADE;
DROP TABLE IF EXISTS operacoes CASCADE;
DROP TABLE IF EXISTS perfis CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS camaras CASCADE;

-- Enable UUID extension
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

-- 2. SEGURANÇA & PERFIS (RBAC)
CREATE TABLE perfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL, -- Ex: 'Presidente', 'Secretário'
  tipo_base TEXT NOT NULL CHECK (tipo_base IN ('PRESIDENTE', 'SECRETARIO', 'VEREADOR', 'ADMIN')),
  camara_id UUID REFERENCES camaras(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE operacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL, -- Ex: 'SESSAO_ABRIR', 'VOTACAO_INICIAR'
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
  tempo_cronometro INTEGER DEFAULT 0, -- em segundos
  permite_votacao BOOLEAN DEFAULT false,
  exige_quorum_minimo BOOLEAN DEFAULT true,
  percentual_quorum FLOAT DEFAULT 0.33 -- 1/3, 0.5, 0.66
);

-- 5. EXECUÇÃO DA SESSÃO
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

-- 6. DELIBERAÇÃO & VOTAÇÃO
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

-- 7. REALTIME & RLS
ALTER PUBLICATION supabase_realtime ADD TABLE 
  sessoes, presencas, votacoes, votos, configuracao_fases, usuarios, parlamentares;

-- Habilitar RLS
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

-- Políticas de Acesso
CREATE POLICY "Leitura pública para usuários autenticados" ON sessoes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Leitura pública de itens de pauta" ON itens_pauta FOR SELECT USING (true);
CREATE POLICY "Leitura pública de votações" ON votacoes FOR SELECT USING (true);
CREATE POLICY "Leitura pública de câmaras" ON camaras FOR SELECT USING (true);
CREATE POLICY "Usuários podem ver perfis da sua câmara" ON usuarios FOR SELECT USING (true);

-- 8. SEED DATA (DADOS INICIAIS)

-- Inserir Operações
INSERT INTO operacoes (codigo, descricao) VALUES
('SESSAO_ABRIR', 'Abrir nova sessão plenária'),
('SESSAO_AVANCAR', 'Avançar fase da sessão'),
('VOTACAO_INICIAR', 'Iniciar votação de matéria'),
('VOTACAO_ENCERRAR', 'Encerrar votação de matéria'),
('VOTAR', 'Registrar voto em matéria'),
('PRESENCA_REGISTRAR', 'Registrar presença na sessão');

-- Criar Câmara de Exemplo
INSERT INTO camaras (id, nome, cidade, estado) VALUES
('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Câmara Municipal de Exemplo', 'Brasília', 'DF');

-- Criar Perfis Padrão para a Câmara de Exemplo (IDs HEX válidos)
INSERT INTO perfis (id, nome, tipo_base, camara_id) VALUES
('a1111111-1111-1111-1111-111111111111', 'Presidente', 'PRESIDENTE', 'd290f1ee-6c54-4b01-90e6-d701748f0851'),
('b2222222-2222-2222-2222-222222222222', 'Secretário', 'SECRETARIO', 'd290f1ee-6c54-4b01-90e6-d701748f0851'),
('c3333333-3333-3333-3333-333333333333', 'Vereador', 'VEREADOR', 'd290f1ee-6c54-4b01-90e6-d701748f0851');

-- Associar Operações aos Perfis
INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT 'a1111111-1111-1111-1111-111111111111', id FROM operacoes;

INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT 'b2222222-2222-2222-2222-222222222222', id FROM operacoes 
WHERE codigo IN ('SESSAO_AVANCAR', 'VOTACAO_INICIAR', 'VOTACAO_ENCERRAR', 'PRESENCA_REGISTRAR');

INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT 'c3333333-3333-3333-3333-333333333333', id FROM operacoes 
WHERE codigo IN ('VOTAR', 'PRESENCA_REGISTRAR');

-- Criar Template de Rito e Fases (Corrigido para 'e' em vez de 't')
INSERT INTO templates_rito (id, camara_id, nome) VALUES
('e1111111-1111-1111-1111-111111111111', 'd290f1ee-6c54-4b01-90e6-d701748f0851', 'Rito Ordinário Padrão');

INSERT INTO configuracao_fases (template_id, nome_fase, ordem, tempo_cronometro, permite_votacao, exige_quorum_minimo, percentual_quorum) VALUES
('e1111111-1111-1111-1111-111111111111', 'Pequeno Expediente', 0, 900, false, true, 0.33),
('e1111111-1111-1111-1111-111111111111', 'Ordem do Dia', 1, 3600, true, true, 0.5),
('e1111111-1111-1111-1111-111111111111', 'Explicações Pessoais', 2, 600, false, false, 0);
