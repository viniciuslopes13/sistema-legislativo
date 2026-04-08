-- 24_FIX_RBAC_AND_USUARIO_PERFIS
-- Estabelece as Políticas de RLS em falta para as tabelas vitais de Gestão de RBAC.
-- Isso permite Deleção e Inserção diretas pelas requisições dos Administradores Globais ou Presidentes,
-- destravando o impedimento silencioso que causava duplicação na troca de cargos.

-- 1. Políticas de Manipulação Dinâmica para usuario_perfis
DROP POLICY IF EXISTS "Admins possuem controle total de relacionamentos de perfis" ON public.usuario_perfis;
CREATE POLICY "Admins possuem controle total de relacionamentos de perfis" ON public.usuario_perfis 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.usuario_perfis up 
        JOIN public.perfis p ON up.perfil_id = p.id 
        WHERE up.usuario_id = auth.uid() AND p.tipo_base IN ('ADMIN', 'PRESIDENTE')
    )
    OR public.is_admin()
);

-- 2. Políticas de Configuração Absoluta Mestre (Apenas Admin Master ou Presidente para Perfis e Permissões)
DROP POLICY IF EXISTS "Admins podem manejar perfis" ON public.perfis;
CREATE POLICY "Admins podem manejar perfis" ON public.perfis 
FOR ALL USING ( public.is_admin() );

-- Permitir Leitura global dos perfis (Vital para o painel popular as multiselections)
DROP POLICY IF EXISTS "Autenticados lêem perfis publicamente" ON public.perfis;
CREATE POLICY "Autenticados lêem perfis publicamente" ON public.perfis 
FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir Leitura global das operacoes (Vital para Matriz de Segurança)
DROP POLICY IF EXISTS "Autenticados lêem operacoes" ON public.operacoes;
CREATE POLICY "Autenticados lêem operacoes" ON public.operacoes 
FOR SELECT USING (auth.role() = 'authenticated');

-- Controle Mestre de Operações
DROP POLICY IF EXISTS "Admin manipula operacoes" ON public.operacoes;
CREATE POLICY "Admin manipula operacoes" ON public.operacoes 
FOR ALL USING ( public.is_admin() );

-- Controle Mestre de cruzamentos de Permissoões (perfil_operacoes)
DROP POLICY IF EXISTS "Admin cruza operacoes" ON public.perfil_operacoes;
CREATE POLICY "Admin cruza operacoes" ON public.perfil_operacoes 
FOR ALL USING ( public.is_admin() );

-- Permitir Leitura global das conexões do RBAC
DROP POLICY IF EXISTS "Autenticados lêem perfil_operacoes" ON public.perfil_operacoes;
CREATE POLICY "Autenticados lêem perfil_operacoes" ON public.perfil_operacoes
FOR SELECT USING (auth.role() = 'authenticated');
