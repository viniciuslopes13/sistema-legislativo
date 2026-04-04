-- 17_FIX METADATA READING
-- Permite que usuários autenticados leiam as tabelas de configuração de segurança e parlamentares.
-- Sem isso, o sistema não consegue carregar o perfil do usuário logado.

-- 1. PERFIS
DROP POLICY IF EXISTS "Leitura de perfis para autenticados" ON public.perfis;
CREATE POLICY "Leitura de perfis para autenticados" ON public.perfis 
FOR SELECT USING (auth.role() = 'authenticated');

-- 2. OPERAÇÕES (PERMISSÕES)
DROP POLICY IF EXISTS "Leitura de operacoes para autenticados" ON public.operacoes;
CREATE POLICY "Leitura de operacoes para autenticados" ON public.operacoes 
FOR SELECT USING (auth.role() = 'authenticated');

-- 3. VÍNCULO PERFIL-OPERAÇÃO
DROP POLICY IF EXISTS "Leitura de perfil_operacoes para autenticados" ON public.perfil_operacoes;
CREATE POLICY "Leitura de perfil_operacoes para autenticados" ON public.perfil_operacoes 
FOR SELECT USING (auth.role() = 'authenticated');

-- 4. PARLAMENTARES
-- Um usuário deve conseguir ler os dados parlamentares de qualquer um da sua câmara, 
-- ou o Admin deve ler de todos.
DROP POLICY IF EXISTS "Leitura de parlamentares por câmara ou admin" ON public.parlamentares;
CREATE POLICY "Leitura de parlamentares por câmara ou admin" ON public.parlamentares 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = parlamentares.id 
    AND (u.camara_id = public.obter_minha_camara() OR public.usuario_e_admin())
  )
  OR id = auth.uid() -- Garante que carrega o próprio perfil mesmo se a função acima falhar momentaneamente
);

-- 5. CÂMARAS
-- Usuários autenticados precisam ler os dados da câmara (nome, logo) para montar a interface.
DROP POLICY IF EXISTS "Leitura de camaras para autenticados" ON public.camaras;
CREATE POLICY "Leitura de camaras para autenticados" ON public.camaras 
FOR SELECT USING (auth.role() = 'authenticated');
