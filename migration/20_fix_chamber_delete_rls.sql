-- 20_FIX CHAMBER DELETE RLS
-- Permite que Administradores Globais excluam registros da tabela de Câmaras.

-- 1. Remover políticas antigas limitadas
DROP POLICY IF EXISTS "Admins podem editar câmaras" ON public.camaras;

-- 2. Criar política abrangente (SELECT, INSERT, UPDATE, DELETE) para Admins
CREATE POLICY "Admin Global possui controle total sobre camaras" 
ON public.camaras 
FOR ALL 
USING (public.is_admin());

-- 3. Garantir que outros usuários logados continuem podendo ler as câmaras
-- (Necessário para a tela de seleção pública e identificação institucional)
DROP POLICY IF EXISTS "Leitura de camaras para autenticados" ON public.camaras;
CREATE POLICY "Qualquer usuario autenticado le camaras" 
ON public.camaras 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Permitir leitura anônima para o telão público
CREATE POLICY "Leitura publica de camaras" 
ON public.camaras 
FOR SELECT 
USING (true);
