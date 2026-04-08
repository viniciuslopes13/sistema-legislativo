-- 28_SWEEP_FINAL_LOOSE_ENDS
-- Registra a operação mandatória global e substitui os eAdminGlobal()

INSERT INTO operacoes (codigo, descricao)
SELECT * FROM (VALUES
    ('SISTEMA_ADMINISTRAR_TENANTS', 'Habilidade Cross-Câmara - Pular travas de inatividade locais e transitar entre tenants invisivelmente')
) AS v(codigo, descricao)
WHERE NOT EXISTS (SELECT 1 FROM operacoes o WHERE o.codigo = v.codigo);

-- Atribuir SISTEMA_ADMINISTRAR_TENANTS APENAS ao Administrador Global (Admin)
INSERT INTO perfil_operacoes (perfil_id, operacao_id)
SELECT p.id, o.id 
FROM perfis p
CROSS JOIN operacoes o
WHERE p.tipo_base = 'ADMIN' 
  AND o.codigo = 'SISTEMA_ADMINISTRAR_TENANTS'
  AND NOT EXISTS (SELECT 1 FROM perfil_operacoes po WHERE po.perfil_id = p.id AND po.operacao_id = o.id);
