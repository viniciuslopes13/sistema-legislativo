import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Usuario } from '../models/Usuario.model';
import { autenticacaoService } from '../services/autenticacao.service';
import { usuarioService } from '../services/usuario.service';

export function useAuth() {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [autenticacaoPronta, setAutenticacaoPronta] = useState(false);
  const [channelId] = useState(() => Math.random().toString(36).substring(7));
  const refIdUsuarioAtual = useRef<string | null>(null);

  const buscarPerfil = useCallback(async (idUsuario: string) => {
    try {
      const dto = await usuarioService.buscarPerfilPorId(idUsuario);
      if (dto) {
        setUsuarioAtual(Usuario.deDTO(dto));
      } else {
        setUsuarioAtual(null);
      }
    } catch (err) {
      console.error("Erro crítico ao carregar perfil:", err);
      setUsuarioAtual(null);
    } finally {
      setAutenticacaoPronta(true);
    }
  }, []);

  // Engine: Ciclo de vida da autenticação
  useEffect(() => {
    autenticacaoService.obterSessaoAtual().then(session => {
      if (session?.user) {
        refIdUsuarioAtual.current = session.user.id;
        buscarPerfil(session.user.id);
      } else {
        refIdUsuarioAtual.current = null;
        setUsuarioAtual(null);
        setAutenticacaoPronta(true);
      }
    });

    const sub = autenticacaoService.onEstadoAutenticacaoAlterado((_event, session) => {
      if (session?.user) {
        if (!refIdUsuarioAtual.current || refIdUsuarioAtual.current !== session.user.id) {
          setAutenticacaoPronta(false);
        }
        refIdUsuarioAtual.current = session.user.id;
        buscarPerfil(session.user.id);
      } else {
        refIdUsuarioAtual.current = null;
        setUsuarioAtual(null);
        setAutenticacaoPronta(true);
      }
    });
    return () => sub.unsubscribe();
  }, [buscarPerfil]);

  // Engine: Escuta de mudanças em tempo real no perfil do usuário logado
  useEffect(() => {
    if (!autenticacaoPronta || !refIdUsuarioAtual.current) return;

    // Usamos um canal dedicado apenas para refletir atualizações no próprio usuário (ex: alteração de permissão).
    // Nota: Como o Supabase não permite filtrar facilmente por múltiplas tabelas, 
    // Filtramos apenas localmente chamando o update.
    const canal = supabase.channel(`auth_perfil_${refIdUsuarioAtual.current}_${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, (payload) => {
        if (payload.new && (payload.new as any).id === refIdUsuarioAtual.current) {
           buscarPerfil(refIdUsuarioAtual.current);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuario_perfis' }, (payload) => {
        if (payload.new && (payload.new as any).usuario_id === refIdUsuarioAtual.current) {
           buscarPerfil(refIdUsuarioAtual.current);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [autenticacaoPronta, buscarPerfil, channelId]);

  const sair = async () => {
    try {
      setUsuarioAtual(null);
      refIdUsuarioAtual.current = null;
      await autenticacaoService.logout();
      setAutenticacaoPronta(true);
    } catch (e) {
      console.error("Erro ao sair:", e);
      setUsuarioAtual(null);
      window.location.href = '/login'; 
    }
  };

  return {
    usuarioAtual,
    autenticacaoPronta,
    buscarPerfil,
    sair
  };
}
