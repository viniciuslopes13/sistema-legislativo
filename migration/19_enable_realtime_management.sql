-- 19_ENABLE REALTIME MANAGEMENT (Corrigido)
-- Garante que as tabelas de gestão estejam no Realtime sem causar erros de duplicidade.

-- 1. Tentamos adicionar as tabelas individualmente. 
-- Se você rodar no editor SQL e der erro em uma, pode rodar as outras.
-- Alternativamente, este comando redefine a lista completa garantindo que todos os itens necessários estejam lá:
ALTER PUBLICATION supabase_realtime SET TABLE 
  public.sessoes, 
  public.presencas, 
  public.votacoes, 
  public.votos, 
  public.configuracao_fases,
  public.usuarios,
  public.camaras,
  public.parlamentares,
  public.usuario_perfis;

-- 2. Configurar Identidade de Réplica para eventos de DELETE
-- Isso é fundamental para que o frontend saiba QUAL ID foi deletado.
ALTER TABLE public.usuarios REPLICA IDENTITY FULL;
ALTER TABLE public.camaras REPLICA IDENTITY FULL;
ALTER TABLE public.parlamentares REPLICA IDENTITY FULL;
ALTER TABLE public.sessoes REPLICA IDENTITY FULL;
