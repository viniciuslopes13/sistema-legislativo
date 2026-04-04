import { supabase } from '../lib/supabase';

/**
 * Serviço responsável por toda a lógica de autenticação do sistema.
 * Gerencia login com e-mail, Google, logout e verificação de sessões.
 */
export const autenticacaoService = {
  /**
   * Realiza login utilizando OAuth do Google.
   */
  async loginComGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/sistema',
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Realiza login com e-mail e senha.
   * Suporta o fluxo de senha provisória (antes de ser alterada pelo usuário).
   */
  async loginComEmail(email: string, pass: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      return { user: data.user, session: data.session, isProvisional: false };
    } catch (authError) {
      // Caso o login falhe no Auth, verificamos se existe uma senha provisória no banco
      const { data: usuario, error: dbError } = await supabase
        .from('usuarios')
        .select('id, email, senha_provisoria, senha_alterada')
        .eq('email', email)
        .single();

      if (!dbError && usuario) {
        // Se a senha não foi alterada e coincide com a provisória
        if (!usuario.senha_alterada && usuario.senha_provisoria === pass) {
          return { 
            user: { id: usuario.id, email: usuario.email }, 
            isProvisional: true 
          };
        }
      }
      
      throw authError;
    }
  },

  /**
   * Realiza o registro inicial de um novo usuário via Auth.
   */
  async registrarComEmail(email: string, pass: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Finaliza a sessão atual do usuário.
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Obtém a sessão atual do Supabase.
   */
  async obterSessaoAtual() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /**
   * Inscreve-se para mudanças no estado da autenticação.
   */
  onEstadoAutenticacaoAlterado(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
};
