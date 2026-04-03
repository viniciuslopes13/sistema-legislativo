-- SGLM Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Camaras Table
CREATE TABLE camaras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  logo_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Usuarios Table (Extends Supabase Auth)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  ativo BOOLEAN DEFAULT true,
  perfil TEXT CHECK (perfil IN ('PRESIDENTE', 'SECRETARIO', 'VEREADOR', 'ADMIN')),
  camara_id UUID REFERENCES camaras(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Parlamentares Table (Extends Usuarios)
CREATE TABLE parlamentares (
  id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  partido TEXT NOT NULL,
  cargo_mesa TEXT,
  foto_url TEXT,
  is_suplente BOOLEAN DEFAULT false,
  em_exercicio BOOLEAN DEFAULT true
);

-- Sessoes Table
CREATE TABLE sessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camara_id UUID REFERENCES camaras(id) ON DELETE CASCADE,
  template_id TEXT,
  data_inicio TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('AGUARDANDO', 'EM_CURSO', 'FINALIZADA')) DEFAULT 'AGUARDANDO',
  fase_indice_atual INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Itens Pauta Table
CREATE TABLE itens_pauta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessao_id UUID REFERENCES sessoes(id) ON DELETE CASCADE,
  titulo_manual TEXT NOT NULL,
  ementa_manual TEXT,
  ordem INTEGER NOT NULL,
  tipo_materia TEXT CHECK (tipo_materia IN ('PL', 'VETO', 'REQUERIMENTO')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Votacoes Table
CREATE TABLE votacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessao_id UUID REFERENCES sessoes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES itens_pauta(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('NAO_INICIADA', 'VOTANDO', 'CONCLUIDA')) DEFAULT 'NAO_INICIADA',
  tipo_quorum TEXT CHECK (tipo_quorum IN ('MAIORIA_SIMPLES', 'MAIORIA_ABSOLUTA', 'DOIS_TERCOS')),
  hora_inicio TIMESTAMPTZ,
  hora_fim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Votos Table
CREATE TABLE votos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  votacao_id UUID REFERENCES votacoes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  opcao TEXT CHECK (opcao IN ('SIM', 'NAO', 'ABSTER')),
  is_voto_minerva BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Presencas Table
CREATE TABLE presencas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessao_id UUID REFERENCES sessoes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE camaras, usuarios, parlamentares, sessoes, itens_pauta, votacoes, votos, presencas;

-- RLS (Row Level Security) - Basic Setup
-- You can refine these rules as needed.

ALTER TABLE camaras ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE parlamentares ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pauta ENABLE ROW LEVEL SECURITY;
ALTER TABLE votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;

-- Policies (Example for Camaras)
CREATE POLICY "Camaras are viewable by everyone" ON camaras FOR SELECT USING (true);
CREATE POLICY "Admins can manage camaras" ON camaras FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'ADMIN')
);

-- Policies (Example for Usuarios)
CREATE POLICY "Profiles are viewable by everyone" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON usuarios FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON usuarios FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'ADMIN')
);

-- Policies for Parlamentares
ALTER TABLE parlamentares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parlamentares are viewable by everyone" ON parlamentares FOR SELECT USING (true);
CREATE POLICY "Admins can manage parlamentares" ON parlamentares FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'ADMIN')
);

-- Policies for Sessoes
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessoes are viewable by everyone" ON sessoes FOR SELECT USING (true);

-- Policies for Itens Pauta
ALTER TABLE itens_pauta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Itens are viewable by everyone" ON itens_pauta FOR SELECT USING (true);

-- Policies for Votacoes
ALTER TABLE votacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votacoes are viewable by everyone" ON votacoes FOR SELECT USING (true);

-- Policies for Votos
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votos are viewable by everyone" ON votos FOR SELECT USING (true);

-- Policies for Presencas
ALTER TABLE presencas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Presencas are viewable by everyone" ON presencas FOR SELECT USING (true);
