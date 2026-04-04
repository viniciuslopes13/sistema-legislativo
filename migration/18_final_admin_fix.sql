-- 18_FINAL ADMIN FIX
-- Remove recursividade e garante acesso absoluto para Administradores.

-- 1. Simplificar verificação de Admin (evita loops de RLS)
-- Usamos SECURITY DEFINER para que a função rode com privilégios de sistema, ignorando RLS interno.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.usuario_id = auth.uid() AND p.tipo_base = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Aplicar BYPASS nas tabelas principais para Administradores
-- Sessoes
DROP POLICY IF EXISTS "Acesso de Sessões: Câmara ou Admin" ON sessoes;
CREATE POLICY "Admin Global Bypass Sessoes" ON sessoes FOR ALL USING (public.is_admin() OR camara_id = public.obter_minha_camara());

-- Usuarios
DROP POLICY IF EXISTS "Leitura de Usuário: Próprio ou Admin" ON usuarios;
CREATE POLICY "Admin Global Bypass Usuarios" ON usuarios FOR ALL USING (public.is_admin() OR id = auth.uid());

-- Perfis e Vinculos (Crucial para o Login)
-- Permitimos que usuários logados leiam SEUS PRÓPRIOS vínculos sem checar se são admin (evita recursão)
DROP POLICY IF EXISTS "Leitura de Perfis: Próprio ou Gestor" ON usuario_perfis;
CREATE POLICY "Usuarios leem seus proprios perfis" ON usuario_perfis FOR SELECT USING (usuario_id = auth.uid() OR public.is_admin());

-- 3. Garantir que Tabelas de Apoio sejam legíveis
DROP POLICY IF EXISTS "Leitura de perfis para autenticados" ON public.perfis;
CREATE POLICY "Leitura de perfis total" ON public.perfis FOR SELECT USING (true); -- Tabelas de metadados podem ser públicas para leitura

DROP POLICY IF EXISTS "Leitura de operacoes para autenticados" ON public.operacoes;
CREATE POLICY "Leitura de operacoes total" ON public.operacoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura de perfil_operacoes para autenticados" ON public.perfil_operacoes;
CREATE POLICY "Leitura de perfil_operacoes total" ON public.perfil_operacoes FOR SELECT USING (true);
