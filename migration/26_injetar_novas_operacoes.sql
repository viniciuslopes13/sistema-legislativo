-- 26_INJETAR_NOVAS_OPERACOES
-- Registra as novas funcionalidades globais e as atrela automaticamente a todos os perfis cuja base técnica seja ADMIN.

-- 1. Inserir Novas Operações de Controle (Ignora se já existir usando ON CONFLICT, mas como não temos UNIQUE CONSTRAINT no codigo, usamos um bloco anonimo ou INSERT seletivo)
INSERT INTO operacoes (codigo, descricao)
SELECT * FROM (VALUES
    ('GERENCIAR_USUARIOS_E_CAMARAS', 'Acesso completo à gestão de usuários, papéis e câmaras na aba de Gestão Legislativa do SGLM'),
    ('SISTEMA_CONFIGURAR', 'Acesso à estruturação técnica de ritos, fases e templates globais da Casa'),
    ('GERENCIAR_CONTRATOS', 'Acesso ao painel administrativo de Contratos e Licitações'),
    ('PAUTA_CRIAR_ITENS', 'Permissão para redigir, protocolar e enviar pautas da ordem do dia')
) AS v(codigo, descricao)
WHERE NOT EXISTS (
    SELECT 1 FROM operacoes o WHERE o.codigo = v.codigo
);

-- 2. Atrelar as operações acima a TODOS os perfis que sejam de nivel 'ADMIN' (Como o Administrador Global)
INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT p.id, o.id 
FROM perfis p
CROSS JOIN operacoes o
WHERE p.tipo_base = 'ADMIN' 
  AND o.codigo IN ('GERENCIAR_USUARIOS_E_CAMARAS', 'SISTEMA_CONFIGURAR', 'GERENCIAR_CONTRATOS', 'PAUTA_CRIAR_ITENS')
  AND NOT EXISTS (
      SELECT 1 FROM perfil_operacoes po WHERE po.perfil_id = p.id AND po.operacao_id = o.id
  );
