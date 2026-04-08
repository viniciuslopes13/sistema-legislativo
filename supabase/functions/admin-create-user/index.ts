import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Falta o cabeçalho de Authorization. O App não enviou o JWT ou você não está logado.');

    const { email, password, nome } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('ERRO FATAL DE NUVEM: Você precisa configurar as variáveis SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY nos Secrets dessa função no Dashboard.');
    }

    // 1. Identificar QUEM disparou a requisição usando a chave anônima + JWT dele
    const supabaseCaller = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: callerError } = await supabaseCaller.auth.getUser(jwt);
    if (callerError || !callerUser) throw new Error('Sessão expirada ou JWT Rejeitado pelo banco: ' + callerError?.message);

    // 2. Instanciar Cliente Admin com poderes totais de Nuvem
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { autoRefreshToken: false, persistSession: false } 
    });

    // 3. Auditoria Forte: O usuário que chamou TEM a operação de Gestão lá no banco?
    const { data: perfis } = await supabaseAdmin.from('usuario_perfis')
      .select('perfis(perfil_operacoes(operacoes(codigo)))')
      .eq('usuario_id', callerUser.id);
    
    const possuiPermissao = JSON.stringify(perfis).includes('GERENCIAR_USUARIOS_E_CAMARAS') || JSON.stringify(perfis).includes('SISTEMA_ADMINISTRAR_TENANTS');
    
    if (!possuiPermissao) {
       throw new Error('Acesso Negado. Você não possui as operações dinâmicas para criar usuários administrativamente (RBAC Bloqueou na Nuvem).');
    }

    // 4. Criação do Usuário
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome }
    });

    if (error) throw new Error('Erro GoTrue Admin: ' + error.message);

    return new Response(JSON.stringify({ user: data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
