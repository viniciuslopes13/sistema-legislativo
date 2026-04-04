-- 13_sessao_management_rls.sql
-- Permite que admins, presidentes e secretários gerenciem as sessões

DROP POLICY IF EXISTS "Gestão de sessões para autorizados" ON sessoes;
CREATE POLICY "Gestão de sessões para autorizados" ON sessoes 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    JOIN usuario_perfis up ON u.id = up.usuario_id
    JOIN perfis p ON up.perfil_id = p.id
    WHERE u.id = auth.uid() AND (
      p.tipo_base = 'ADMIN' OR 
      (p.tipo_base IN ('PRESIDENTE', 'SECRETARIO') AND p.camara_id = sessoes.camara_id)
    )
  )
);

-- Permite que todos os usuários autenticados vejam as sessões da sua própria câmara
DROP POLICY IF EXISTS "Visualização de sessões da câmara" ON sessoes;
CREATE POLICY "Visualização de sessões da câmara" ON sessoes 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios u
    LEFT JOIN usuario_perfis up ON u.id = up.usuario_id
    LEFT JOIN perfis p ON up.perfil_id = p.id
    WHERE u.id = auth.uid() AND (
      u.camara_id = sessoes.camara_id OR 
      p.tipo_base = 'ADMIN'
    )
  )
);
