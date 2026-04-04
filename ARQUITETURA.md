# Arquitetura Profissional do SGLM

Este documento detalha a arquitetura técnica de nível corporativo do **Sistema de Gestão Legislativa Municipal (SGLM)**. O projeto evoluiu de um protótipo para um sistema robusto baseado em camadas, orientado a objetos e com segurança multinível.

## 1. Organização em Camadas (N-Tier Frontend)

O sistema utiliza uma separação rigorosa de responsabilidades para garantir manutenibilidade e escalabilidade.

### 1.1. Contratos de Dados (`src/dtos/`)
Interfaces TypeScript puras que mapeiam as tabelas do banco de dados.
*   **Papel:** Definir a forma dos dados que entram e saem do Supabase.
*   **Exemplos:** `UsuarioDTO`, `SessaoDTO`, `VotacaoDTO`.

### 1.2. Modelos de Domínio (`src/models/`) - Orientação a Objetos
Classes ricas que encapsulam a lógica de negócio legislativa.
*   **Papel:** Receber DTOs e fornecer métodos inteligentes.
*   **Vantagem:** Regras como cálculo de quórum (`Votacao.calcularResultado()`) e permissões (`Usuario.temPermissao()`) estão centralizadas nas classes, facilitando testes e evitando bugs.

### 1.3. Infraestrutura de Dados (`src/services/`)
Camada isolada de comunicação com o Supabase.
*   **Papel:** Realizar operações de CRUD, autenticação e exclusão com validação de integridade.
*   **Destaque:** Implementa lógica de exclusão segura (checando vínculos) e gestão de senhas provisórias.

### 1.4. Orquestração de Estado Global (`src/context/` e `src/hooks/`)
Utiliza a **React Context API** para manter o sistema sincronizado.
*   **SGLMProvider:** Mantém uma única conexão WebSocket (Realtime) ativa e compartilha o estado (usuário, sessão, votos) com todo o app.
*   **ToastContext:** Provê um sistema global de notificações para sucessos e erros.

### 1.5. Interface do Usuário (`src/pages/` e `src/components/`)
*   **Pages:** Orquestradores de rota que consomem o contexto global.
*   **Components/UI:** Peças genéricas como o `ConfirmModal`.
*   **Components/Legislativo:** Peças especializadas como `CronometroFase` e `ItemPautaDestaque`.

---

## 2. Segurança e Proteção

A segurança do SGLM é aplicada em três frentes:

### 2.1. Guards de Rota (`src/guards/`)
Componentes que interceptam a navegação antes da renderização:
*   **RotaPrivada:** Exige login.
*   **RotaPublica:** Redireciona usuários logados para fora do login.
*   **CamaraAtivaGuard:** Bloqueia acesso se a Câmara estiver suspensa.
*   **PermissaoGuard:** Controle de acesso granular (RBAC).
*   **AdminGlobalGuard:** Acesso exclusivo para gestão global do sistema.

### 2.2. Row Level Security (RLS) no Banco de Dados
O banco de dados PostgreSQL (Supabase) atua como o último e mais forte segurança.
*   **Isolamento Multi-tenant:** Um usuário nunca consegue ler ou alterar dados de outra Câmara.
*   **Segurança de Voto:** Um parlamentar só consegue inserir votos em seu próprio ID (`auth.uid()`).
*   **Security Definer:** Funções críticas de admin rodam com privilégios protegidos para evitar recursividade de permissões.

### 2.3. Auditoria e Logs
Tabela `logs_eventos` alimentada por **Database Triggers**. Toda ação crítica (voto, início de sessão, alteração de usuário) é registrada com timestamp e metadados de quem realizou a operação.

---

## 3. Identidade Visual e UX

*   **Tema:** Light Theme (Claro), focado em sobriedade e leitura em ambientes legislativos.
*   **Feedback:** Uso de Toasts e Modais personalizados em vez de diálogos nativos do navegador.
*   **Performance:** Paginação de 10 registros por página na gestão para manter a fluidez da interface.

## 4. Veredito de Produção

**Status: Pronto para Produção (Enterprise Ready).**

A arquitetura atual permite o crescimento do sistema para múltiplas instâncias sem degradação técnica. A separação em camadas garante que o projeto possa migrar para um backend dedicado no futuro apenas movendo as pastas `services` e `models`.

---
*Documentação atualizada em: Abril de 2026*
