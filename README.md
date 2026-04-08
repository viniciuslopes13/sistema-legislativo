# SGLM - Sistema de Gestão Legislativa Municipal

O **SGLM** é uma plataforma de nível profissional para gestão de sessões plenárias e votação eletrônica em tempo real, focada em transparência, segurança e eficiência para Câmaras Municipais.

## 🚀 Novas Funcionalidades e Melhorias

- **Arquitetura em Camadas:** Sistema organizado com separação de responsabilidades (DTOs, Domain Models e Services).
- **Tempo Real (Supabase Realtime):** Sincronização instantânea de votações, presenças e cronômetros de fase.
- **Multi-tenancy:** Suporte a múltiplas Câmaras Municipais com isolamento total de dados via Row Level Security (RLS).
- **Segurança Avançada:** Proteção de rotas via Guards e auditoria nativa no banco de dados.
- **Paradigma de Permissões (RBAC Puro):** As views e funcionalidades não dependem de cargos rígidos. Todas as travas são orientadas a Operações configuráveis (ex: em vez de "É Presidente?", o sistema pergunta "Tem permissão para GERENCIAR_SESSAO?"). Qualquer nova aba ou funcionalidade futura deve ser atrelada à estrutura de operações.
- **Interface Moderna (Tema Claro):** UX refinada com sistema de notificações (Toasts) e modais customizados.
- **Portal de Transparência:** Telão público para acompanhamento populacional em tempo real com busca de municípios.

## 🛠️ Stack Tecnológica

- **Frontend:** React 19, Vite, TypeScript.
- **Estilização:** Tailwind CSS 4, Framer Motion (animações).
- **Banco de Dados & Realtime:** PostgreSQL via **Supabase**.
- **Autenticação:** Supabase Auth (E-mail/Senha com suporte a senhas provisórias).
- **Ícones:** Lucide React.

## 📁 Estrutura de Pastas

```text
src/
├── components/     # Componentes reutilizáveis (UI e Legislativo)
├── context/        # Estado Global (Context API) e Notificações
├── dtos/           # Contratos de dados brutos do banco
├── guards/         # Proteções de rotas e permissões
├── hooks/          # Orquestração de Tempo Real
├── models/         # Classes Orientadas a Objetos (Lógica de Negócio)
├── pages/          # Páginas principais do sistema
└── services/       # Comunicação isolada com Supabase
```

## ⚙️ Como Rodar Localmente

1.  **Instale as dependências**:
    ```bash
    npm install
    ```

2.  **Configure as variáveis de ambiente**:
    Crie um arquivo `.env` na raiz do projeto:
    ```env
    VITE_SUPABASE_URL=sua_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
    ```

3.  **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

## 🔐 Segurança e Banco de Dados

O sistema depende de políticas de **Row Level Security (RLS)** configuradas no Supabase. 
Para aplicar a estrutura de segurança e auditoria, execute os scripts SQL localizados na pasta `/migration` no seu console do Supabase, seguindo a ordem numérica.

## 📄 Documentação Técnica

Para detalhes aprofundados sobre a lógica de negócio, cálculos de quórum e padrões de projeto utilizados, consulte o arquivo [ARQUITETURA.md](./ARQUITETURA.md).

---
Desenvolvido por SGLM PRO © 2026
