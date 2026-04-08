-- 25_CORRIGIR_RECURSAO_RLS
-- Conserta o bug de recursividade infinita que estava mascarando o perfil Master como Vereador.

-- 1. Criar uma função SECURITY DEFINER para verificar se o usuário pode gerir perfis
-- Funções SECURITY DEFINER ignoram as políticas de RLS e podem consultar `usuario_perfis` sem criar loops infinitos.
CREATE OR REPLACE FUNCTION public.is_gestor_permissao()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.usuario_id = auth.uid() AND p.tipo_base IN ('ADMIN', 'PRESIDENTE')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrigir a Política da Tabela Pivot
-- Removemos a política anterior que tinha a instrução SELECT bruta.
DROP POLICY IF EXISTS "Admins possuem controle total de relacionamentos de perfis" ON public.usuario_perfis;
DROP POLICY IF EXISTS "Gestores possuem controle total de relacionamentos de perfis" ON public.usuario_perfis;

-- Criamos a nova usando as funções blindadas
CREATE POLICY "Gestores possuem controle total de relacionamentos de perfis" ON public.usuario_perfis 
FOR ALL USING (
    public.is_gestor_permissao()
);

-- Garantimos que a política de SELECT própria continue existindo.
DROP POLICY IF EXISTS "Usuarios leem seus proprios perfis" ON public.usuario_perfis;
CREATE POLICY "Usuarios leem seus proprios perfis" ON public.usuario_perfis 
FOR SELECT USING (
    usuario_id = auth.uid() 
    OR public.is_admin() 
    OR public.is_gestor_permissao()
);
