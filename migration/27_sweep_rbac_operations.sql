-- 27_SWEEP_RBAC_OPERATIONS
-- Registra as operações resultantes da varredura final da interface e as distribui.

-- 1. Inserir Operacoes
INSERT INTO operacoes (codigo, descricao)
SELECT * FROM (VALUES
    ('PAINEL_VISUALIZAR', 'Acesso básico de visualização à dashboard principal e andamento das sessões'),
    ('SESSAO_GERENCIAR', 'Acesso ao Console Avançado da Presidência (Controle técnico da Sessão)'),
    ('SESSAO_ENCERRAR', 'Capacidade para forçar a derrubada/encerramento formal de uma Sessão Plenária ativa'),
    ('SESSAO_AGENDAR', 'Capacidade de redigir o cabeçalho, pauta, e agendar uma sessão na agenda institucional')
) AS v(codigo, descricao)
WHERE NOT EXISTS (SELECT 1 FROM operacoes o WHERE o.codigo = v.codigo);

-- 2. Atribuir PAINEL_VISUALIZAR aos Vereadores, Secretarios, Presidentes e Admins
INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT p.id, o.id 
FROM perfis p
CROSS JOIN operacoes o
WHERE p.tipo_base IN ('VEREADOR', 'SECRETARIO', 'PRESIDENTE', 'ADMIN') 
  AND o.codigo = 'PAINEL_VISUALIZAR'
  AND NOT EXISTS (SELECT 1 FROM perfil_operacoes po WHERE po.perfil_id = p.id AND po.operacao_id = o.id);

-- 3. Atribuir SESSAO_AGENDAR aos Secretarios, Presidentes e Admins
INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT p.id, o.id 
FROM perfis p
CROSS JOIN operacoes o
WHERE p.tipo_base IN ('SECRETARIO', 'PRESIDENTE', 'ADMIN') 
  AND o.codigo = 'SESSAO_AGENDAR'
  AND NOT EXISTS (SELECT 1 FROM perfil_operacoes po WHERE po.perfil_id = p.id AND po.operacao_id = o.id);

-- 4. Atribuir SESSAO_GERENCIAR e SESSAO_ENCERRAR aos Presidentes e Admins
INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT p.id, o.id 
FROM perfis p
CROSS JOIN operacoes o
WHERE p.tipo_base IN ('PRESIDENTE', 'ADMIN') 
  AND o.codigo IN ('SESSAO_GERENCIAR', 'SESSAO_ENCERRAR')
  AND NOT EXISTS (SELECT 1 FROM perfil_operacoes po WHERE po.perfil_id = p.id AND po.operacao_id = o.id);
