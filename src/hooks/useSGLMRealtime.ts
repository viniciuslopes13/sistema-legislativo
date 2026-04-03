import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sessao, ConfiguracaoFase, ItemPauta, Votacao, Voto, Presenca, Parlamentar, Camara, Usuario } from '../types';

// Mock data for initial state (fallback)
const MOCK_FASES: ConfiguracaoFase[] = [
  { id: 'f1', template_id: 't1', nome_fase: 'Pequeno Expediente', ordem: 0, tempo_cronometro: 900, permite_votacao: false, exige_quorum_minimo: true, percentual_quorum: 0.33 },
  { id: 'f2', template_id: 't1', nome_fase: 'Ordem do Dia', ordem: 1, tempo_cronometro: 3600, permite_votacao: true, exige_quorum_minimo: true, percentual_quorum: 0.5 },
  { id: 'f3', template_id: 't1', nome_fase: 'Discussão em Destaque', ordem: 2, tempo_cronometro: 600, permite_votacao: true, exige_quorum_minimo: true, percentual_quorum: 0.5 },
];

export function useSGLMRealtime(overrideCamaraId?: string) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [fases] = useState<ConfiguracaoFase[]>(MOCK_FASES);
  const [itens, setItens] = useState<ItemPauta[]>([]);
  const [votacaoAtiva, setVotacaoAtiva] = useState<Votacao | null>(null);
  const [votos, setVotos] = useState<Voto[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([]);
  const [camaras, setCamaras] = useState<Camara[]>([]);
  const [currentUser, setCurrentUser] = useState<Parlamentar | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);

  // User Management Functions
  const createUser = async (data: Partial<Parlamentar>) => {
    if (!currentUser || (currentUser.perfil !== 'ADMIN' && currentUser.perfil !== 'PRESIDENTE' && currentUser.perfil !== 'SECRETARIO')) {
      throw new Error('Permissão negada');
    }

    const camaraId = currentUser.perfil === 'ADMIN' ? data.camaraId : currentUser.camaraId;
    if (!camaraId) throw new Error('Câmara não especificada');

    // In Supabase, we would typically use an edge function or a service role to create users
    // For this demo, we'll just insert into the profiles table
    const { error: userError } = await supabase.from('usuarios').insert({
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      camara_id: camaraId,
      ativo: true
    });

    if (userError) throw userError;
  };

  const deleteUser = async (id: string) => {
    if (!currentUser || currentUser.perfil !== 'ADMIN') throw new Error('Permissão negada');
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
  };

  // Camara Management Functions
  const createCamara = async (data: Partial<Camara>) => {
    if (!currentUser || currentUser.perfil !== 'ADMIN') throw new Error('Permissão negada');
    const { error } = await supabase.from('camaras').insert({
      nome: data.nome,
      cidade: data.cidade,
      estado: data.estado,
      ativo: true
    });
    if (error) throw error;
  };

  const deleteCamara = async (id: string) => {
    if (!currentUser || currentUser.perfil !== 'ADMIN') throw new Error('Permissão negada');
    const { error } = await supabase.from('camaras').delete().eq('id', id);
    if (error) throw error;
  };

  // Auth Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('*, parlamentares(*)')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const parlamentarData: Parlamentar = {
            id: profile.id,
            nome: profile.nome,
            email: profile.email,
            perfil: profile.perfil,
            camaraId: profile.camara_id,
            ativo: profile.ativo,
            partido: profile.parlamentares?.partido || 'SGLM',
            cargo_mesa: profile.parlamentares?.cargo_mesa,
            foto_url: profile.parlamentares?.foto_url,
            is_suplente: profile.parlamentares?.is_suplente || false,
            em_exercicio: profile.parlamentares?.em_exercicio || true
          };
          setCurrentUser(parlamentarData);
        } else if (session.user.email === "franciscoviniciuslopescosta@gmail.com") {
          // Super Admin fallback
          const adminData: Parlamentar = {
            id: session.user.id,
            nome: session.user.user_metadata.full_name || 'Super Admin',
            email: session.user.email || '',
            perfil: 'ADMIN',
            partido: 'SGLM',
            ativo: true,
            em_exercicio: true,
            is_suplente: false,
            foto_url: session.user.user_metadata.avatar_url || ''
          };
          setCurrentUser(adminData);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime listeners
  useEffect(() => {
    if (!isAuthReady) return;

    const effectiveCamaraId = overrideCamaraId || currentUser?.camaraId;

    // 1. Camaras Subscription
    const fetchCamaras = async () => {
      let query = supabase.from('camaras').select('*').eq('ativo', true);
      if (currentUser?.perfil !== 'ADMIN' || overrideCamaraId) {
        if (effectiveCamaraId) query = query.eq('id', effectiveCamaraId);
      }
      const { data } = await query.order('nome');
      if (data) setCamaras(data.map(c => ({ ...c, camaraId: c.id })));
    };

    fetchCamaras();
    const camarasChannel = supabase.channel('camaras_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camaras' }, fetchCamaras)
      .subscribe();

    // 2. Sessoes Subscription
    const fetchSessoes = async () => {
      if (!effectiveCamaraId && currentUser?.perfil !== 'ADMIN') return;
      let query = supabase.from('sessoes').select('*').eq('status', 'EM_CURSO');
      if (effectiveCamaraId) query = query.eq('camara_id', effectiveCamaraId);
      
      const { data } = await query.order('data_inicio', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const s = data[0];
        setSessao({
          id: s.id,
          camaraId: s.camara_id,
          template_id: s.template_id,
          data_inicio: s.data_inicio,
          status: s.status,
          fase_indice_atual: s.fase_indice_atual
        });
        fetchItens(s.id);
        fetchVotos(s.id);
      } else {
        setSessao(null);
        setItens([]);
        setVotos([]);
      }
    };

    const fetchItens = async (sessaoId: string) => {
      const { data } = await supabase.from('itens_pauta').select('*').eq('sessao_id', sessaoId).order('ordem');
      if (data) setItens(data);
    };

    const fetchVotos = async (sessaoId: string) => {
      const { data } = await supabase.from('votos').select('*').order('timestamp', { ascending: false });
      if (data) setVotos(data);
    };

    fetchSessoes();
    const sessoesChannel = supabase.channel('sessoes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessoes' }, fetchSessoes)
      .subscribe();

    // 3. Parlamentares Subscription
    const fetchParlamentares = async () => {
      if (!effectiveCamaraId && currentUser?.perfil !== 'ADMIN') return;
      let query = supabase.from('usuarios').select('*, parlamentares(*)');
      if (effectiveCamaraId) query = query.eq('camara_id', effectiveCamaraId);
      
      const { data } = await query;
      if (data) {
        setParlamentares(data.map(p => ({
          id: p.id,
          nome: p.nome,
          email: p.email,
          perfil: p.perfil,
          camaraId: p.camara_id,
          ativo: p.ativo,
          partido: p.parlamentares?.partido || 'SGLM',
          cargo_mesa: p.parlamentares?.cargo_mesa,
          foto_url: p.parlamentares?.foto_url,
          is_suplente: p.parlamentares?.is_suplente || false,
          em_exercicio: p.parlamentares?.em_exercicio || true
        })));
      }
    };

    fetchParlamentares();
    const parlamentaresChannel = supabase.channel('parlamentares_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, fetchParlamentares)
      .subscribe();

    return () => {
      supabase.removeChannel(camarasChannel);
      supabase.removeChannel(sessoesChannel);
      supabase.removeChannel(parlamentaresChannel);
    };
  }, [isAuthReady, currentUser?.camaraId, overrideCamaraId]);

  // Timer logic
  useEffect(() => {
    if (!sessao) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessao]);

  return {
    sessao,
    fases,
    itens,
    votacaoAtiva,
    votos,
    presencas,
    parlamentares,
    camaras,
    currentUser,
    isAuthReady,
    timeLeft,
    createUser,
    deleteUser,
    createCamara,
    deleteCamara,
    openVoting: async (itemId: string) => {
      console.log('Opening voting for item:', itemId);
      setVotacaoAtiva({ id: 'v1', status: 'VOTANDO', tipo_quorum: 'MAIORIA_SIMPLES' });
    },
    closeVoting: async () => {
      setVotacaoAtiva(null);
    },
    castVote: async (opcao: 'SIM' | 'NAO' | 'ABSTER') => {
      if (!currentUser) return;
      console.log('Casting vote:', opcao);
    }
  };
}
