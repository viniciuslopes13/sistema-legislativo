# SGLM - Sistema de Gestão Legislativa Municipal

Este é um sistema moderno para gestão de sessões plenárias e votação eletrônica, focado em transparência e eficiência.

## Funcionalidades

- **Landing Page**: Divulgação do sistema e acesso rápido.
- **Login**: Autenticação segura para parlamentares e servidores.
- **Visão do Vereador**: Interface intuitiva para votação em tempo real.
- **Visão do Presidente**: Painel de controle completo da sessão e votações.
- **Visão do Secretário**: Console para gerenciamento do rito e cronômetros.
- **Telão Público**: Interface otimizada para transmissão e acompanhamento da população.

## Tecnologias Utilizadas

- **React 19** + **Vite**
- **Tailwind CSS 4**
- **Framer Motion** (animações)
- **Lucide React** (ícones)
- **Recharts** (gráficos de votação)
- **Supabase** (Backend as a Service - Realtime & Auth)

## Como Rodar Localmente

1.  **Instale as dependências**:
    ```bash
    npm install
    ```

2.  **Configure as variáveis de ambiente**:
    Crie um arquivo `.env` na raiz do projeto com as seguintes chaves (veja `.env.example`):
    ```env
    VITE_SUPABASE_URL=sua_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
    ```

3.  **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

## Integração com Supabase

O sistema está preparado para integração em tempo real. Para ativar a comunicação real:

1.  Crie as tabelas no Supabase seguindo o modelo de dados (veja o diagrama de classes).
2.  Habilite o **Realtime** para as tabelas `sessoes`, `votos` e `presencas`.
3.  No arquivo `src/hooks/useSGLMRealtime.ts`, substitua os dados mockados por chamadas reais usando o cliente Supabase configurado em `src/lib/supabase.ts`.

## Estrutura do Banco de Dados (Firestore)

O sistema utiliza o **Google Cloud Firestore** para persistência e sincronização em tempo real.

### Coleções Principais

- **`parlamentares`**: Documentos identificados pelo `uid` do Firebase Auth.
  - `nome` (string): Nome completo do parlamentar.
  - `email` (string): E-mail oficial.
  - `partido` (string): Sigla do partido.
  - `perfil` (enum): `VEREADOR`, `PRESIDENTE` ou `SECRETARIO`.
  - `foto_url` (string): URL da foto do perfil.
  - `ativo` (boolean): Status da conta.

- **`sessoes`**: Documentos que representam as sessões plenárias.
  - `data_inicio` (timestamp): Início da sessão.
  - `status` (enum): `EM_CURSO`, `ENCERRADA`, etc.
  - `fase_indice_atual` (number): Índice da fase atual (0 a 2).
  - `votacao_status` (enum): `AGUARDANDO`, `VOTANDO`, `CONCLUIDA`.
  - `item_voto_id` (string): ID do item de pauta em votação.

- **`itens_pauta`**: Subcoleção dentro de cada sessão (`sessoes/{id}/itens_pauta`).
  - `titulo_manual` (string): Título da matéria.
  - `ementa_manual` (string): Descrição detalhada.
  - `ordem` (number): Sequência de exibição.

- **`votos`**: Subcoleção dentro de cada sessão (`sessoes/{id}/votos`).
  - `usuario_id` (string): UID do parlamentar que votou.
  - `opcao` (enum): `SIM`, `NAO`, `ABSTER`.
  - `timestamp` (timestamp): Momento do voto.

## Autenticação

O sistema suporta dois métodos de acesso:
1. **Google Login**: Acesso rápido para contas institucionais.
2. **E-mail e Senha**: Acesso comum para usuários cadastrados manualmente.

> **Nota**: Para habilitar o login por e-mail, acesse o Console do Firebase > Authentication > Sign-in method e ative o provedor "E-mail/Senha".
