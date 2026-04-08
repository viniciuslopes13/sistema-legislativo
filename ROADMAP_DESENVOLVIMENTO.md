# 🚀 Roadmap de Desenvolvimento - SGLM

Este documento detalha o estágio atual do **Sistema de Gestão Legislativa Municipal** e as tarefas pendentes para cada perfil de usuário.

---

## 📊 Status Geral por Perfil

### 1. Gestão do Sistema (Admin / Gestor) — **90% Concluído** ✅
*O módulo de administração está maduro e funcional.*
- [x] CRUD completo de Usuários (Parlamentares, Admins, etc).
- [x] CRUD de Câmaras Municipais.
- [x] Sistema de busca, filtros e paginação.
- [x] Modais de confirmação e notificações (Toasts).
- [ ] **Pendente:** Visualização de logs de auditoria (quem alterou o quê).

### 2. Painel do Presidente — **60% Concluído** 🕒
*A base está pronta, mas faltam os controles granulares da sessão.*
- [x] Agendamento de sessões e escolha de ritos (templates).
- [x] Abertura formal da sessão (`EM_CURSO`).
- [ ] **Pendente:** Controle manual de troca de fases (Expediente -> Ordem do Dia).
- [ ] **Pendente:** Botão para "Iniciar Votação" e "Encerrar Votação" de um item específico.
- [ ] **Pendente:** Gestão da lista de oradores (quem pediu a palavra).
- [ ] **Pendente:** Encerramento formal da sessão e geração de resumo.

### 3. Painel do Vereador — **50% Concluído** 🕒
*Funcional para o básico, mas precisa de melhor experiência do usuário.*
- [x] Registro de presença em tempo real.
- [x] Interface de votação (Sim, Não, Abster).
- [x] Cronômetro de fase e indicador de quórum.
- [ ] **Pendente:** Visualização da pauta completa (lista de todos os projetos do dia).
- [ ] **Pendente:** Botão para "Pedir a Palavra".
- [ ] **Pendente:** Histórico de como ele votou nos itens anteriores da mesma sessão.

### 4. Painel do Secretário — **0% Concluído** ❌
*Este módulo ainda não foi iniciado.*
- [ ] **Pendente:** Criação da página `PainelSecretarioPage.tsx`.
- [ ] **Pendente:** Funcionalidade de auxílio na conferência de documentos.
- [ ] **Pendente:** Controle de tempo de tribuna para oradores.
- [ ] **Pendente:** Rascunho da ata da sessão em tempo real.

---

## 🛠️ Infraestrutura e Segurança — **85% Concluído** 🛡️
- [x] Banco de Dados Supabase (Schema e Migrations).
- [x] Row Level Security (RLS) configurado para proteção de dados.
- [x] Hook Centralizado de Realtime (`useSGLMRealtime`).
- [ ] **Pendente:** Finalizar lógica de "Destaque de Item" no Realtime (garantir que todos vejam o mesmo projeto ao mesmo tempo).

---

## 🎯 Próximos Passos Sugeridos

1. **Prioridade 1:** Implementar o **Controle de Pauta** no Painel do Presidente (permitir que ele escolha qual item da lista será discutido/votado agora).
2. **Prioridade 2:** Criar o **Painel do Secretário** (pode ser uma versão simplificada do painel do Presidente).
3. **Prioridade 3:** Melhorar o **Feedback Visual** no Painel do Vereador (exibir um comprovante ou sinal claro de "Voto Registrado").

---
*Atualizado em: 04 de Abril de 2026*
