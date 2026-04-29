# Plano de Testes - Jeci Vieira Nails

## Objetivo
Verificar se todas as funcionalidades implementadas estão funcionando corretamente.

---

## Fase 1: Autenticação

### 1.1 Login de Cliente
- [ ] Fazer login com email e senha corretos
- [ ] Verificar redirecionamento para dashboard
- [ ] Tentar login com senha incorreta
- [ ] Verificar mensagem de erro
- [ ] Tentar login com usuário não cadastrado
- [ ] Verificar mensagem de erro

### 1.2 Recuperação de Senha
- [ ] Acessar página "Esqueci a senha"
- [ ] Solicitar redefinição com email válido
- [ ] Verificar email de redefinição recebido
- [ ] Solicitar redefinição com email não cadastrado
- [ ] Verificar comportamento (msg genérica)

### 1.3 Cadastro de Cliente
- [ ] Acessar página de cadastro
- [ ] Preencher dados corretamente
- [ ] Criar conta com sucesso
- [ ] Criar conta com email já existente
- [ ] Verificar mensagem de erro

---

## Fase 2: Agendamento (Cliente)

### 2.1 Seleção de Serviço
- [ ] Acessar página de agendamento logado
- [ ] Listar serviços disponíveis
- [ ] Selecionar um serviço
- [ ] Verificar seleção destacada

### 2.2 Calendário
- [ ] Verificar mês atual
- [ ] Navegar para próximo mês
- [ ] Navegar para mês anterior
- [ ] Verificar dias passados bloqueados
- [ ] Verificar domingos bloqueados
- [ ] Verificar días com agendamentos marcados

### 2.3 Seleção de Horário
- [ ] Selecionar data disponível
- [ ] Listar horários disponíveis
- [ ] Selecionar horário livre
- [ ] Verificar horário selecionado
- [ ] Tentar selecionar horário ocupado
- [ ] Verificar horários bloqueados Admin

### 2.4 Confirmação
- [ ] Clicar em confirmar
- [ ] Verificar modal com dados corretos
- [ ] Confirmar agendamento
- [ ] Verificar sucesso
- [ ] Verificar redirecionamento para dashboard

### 2.5 Notificação WhatsApp
- [ ] Fazer agendamento
- [ ] Verificar admin recebido mensagem WhatsApp
- [ ] Verificar dados corretos na mensagem

---

## Fase 3: Histórico (Cliente)

### 3.1 Lista de Agendamentos
- [ ] Acessar página "Meus Agendamentos"
- [ ] Listar agendamentos futuros
- [ ] Listar agendamentos passados
- [ ] Verificar ordem (mais próximos primeiro)

### 3.2 Informações
- [ ] Verificar serviço
- [ ] Verificar data
- [ ] Verificar horário
- [ ] Verificar valor
- [ ] Verificar status (Pendente/Confirmado/Cancelado)

### 3.3 Cancelamento
- [ ] Clicar em "Cancelar"
- [ ] Verificar modal de confirmação
- [ ] Confirmar cancelamento
- [ ] Verificar status atualizado
- [ ] Verificar WhatsApp enviado para Admin

---

## Fase 4: Perfil (Cliente)

### 4.1 Dados do Perfil
- [ ] Acessar página de perfil
- [ ] Verificar nome
- [ ] Verificar email
- [ ] Verificar telefone

### 4.2 Edição
- [ ] Alterar telefone
- [ ] Salvar alterações
- [ ] Verificar atualização

---

## Fase 5: Dashboard (Cliente)

### 5.1 Exibição
- [ ] Verificar boas-vindas com nome
- [ ] Verificar próximo agendamento
- [ ] Verificar serviços recentes

### 5.2 Navegação
- [ ] Botão "Agendar novo" funciona
- [ ] Menu hambúrguer funciona
- [ ] Botão "Sair" faz logout

---

## Fase 6: Admin - Solicitações

### 6.1 Lista de Solicitações
- [ ] Verificar badge com quantidade
- [ ] Listar agendamentos pendentes
- [ ] Verificar ordenação (data/hora)

### 6.2 Ações
- [ ] Visualizar detalhes do agendamento
- [ ] Confirmar via sistema (botão ✓)
- [ ] Confirmar via WhatsApp (botão WhatsApp)
- [ ] Cancelar agendamento
- [ ] Verificar atualização em tempo real

---

## Fase 7: Admin - Confirmações

### 7.1 Lista de Confirmações
- [ ] Verificar menu "Confirmações"
- [ ] Verificar badge com quantidade pendente
- [ ] Listar agendamentos dos próximos dias
- [ ] Verificar label "Amanhã" para próximo dia

### 7.2 Envio de Mensagem
- [ ] Clicar em botão WhatsApp
- [ ] Verificar WhatsApp Web/App aberto
- [ ] Verificar mensagem pré-formatada
- [ ] Verificar dados corretos (nome, serviço, data, hora)

### 7.3 Confirmação Interna
- [ ] Clicar em confirmar (✓)
- [ ] Verificar status alterado para "Confirmado"
- [ ] Verificar ícone atualizado

---

## Fase 8: Admin - Agenda

### 8.1 Calendário
- [ ] Verificar calendário do mês atual
- [ ] Navegar para próximo mês
- [ ] Navegar para mês anterior
- [ ] Verificar dias com agendamentos marcados

### 8.2 Lista Diária
- [ ] Selecionar dia no calendário
- [ ] Listar agendamentos do dia
- [ ] Verificar ordenação por horário
- [ ] Verificar status visual (cor)

### 8.3 Detalhes
- [ ] Clicar em agendamento
- [ ] Verificar modal com detalhes
- [ ] Verificar campos: serviço, cliente, data, hora, valor, status
- [ ] Verificarbotões de ação

---

## Fase 9: Admin - Serviços

### 9.1 Criar Serviço
- [ ] Clicar em "Adicionar Serviço"
- [ ] Preencher nome
- [ ] Preencher descrição
- [ ] Preencher preço
- [ ] Preencher duração
- [ ] Selecionar ícone
- [ ] Salvar serviço
- [ ] Verificar serviço na lista

### 9.2 Editar Serviço
- [ ] Clicar em serviço existente
- [ ] Alterar dados
- [ ] Salvar alterações
- [ ] Verificar atualização

### 9.3 Excluir Serviço
- [ ] Clicar em excluir
- [ ] Confirmar exclusão
- [ ] Verificar serviço removido

---

## Fase 10: Admin - Configurações

### 10.1 Horários de Funcionamento
- [ ] Editar horário de abertura (segunda)
- [ ] Editar intervalo (início/fim)
- [ ] Editar horário de fechamento (segunda)
- [ ] Configurar domingo fechado/aberto
- [ ] Salvar configurações
- [ ] Verificar funcionamento no dia seguinte

### 10.2 Configurações Gerais
- [ ] Editar intervalo entre agendamentos
- [ ] Editar telefone do salão
- [ ] Editar endereço
- [ ] Salvar alterações

---

## Fase 11: Admin - Bloqueios

### 11.1 Criar Bloqueio
- [ ] Clicar em adicionar bloqueio
- [ ] Selecionar data
- [ ] Selecionar hora início
- [ ] Selecionar hora fim
- [ ] Inserir motivo
- [ ] Criar bloqueio

### 11.2 Remover Bloqueio
- [ ] Verificar bloqueio na lista
- [ ] Clicar em remover
- [ ] Confirmar remoção

### 11.3 Verificação
- [ ] Tentar agendar em horário bloqueado
- [ ] Verificar horário bloqueado

---

## Fase 12: Admin - Clientes

### 12.1 Lista
- [ ] Acessar seção clientes
- [ ] Listar clientes cadastrados
- [ ] Verificar ordenação por nome

### 12.2 Dados
- [ ] Verificar dados do cliente

---

## Fase 13: Admin - Avisos

### 13.1 Criar Aviso
- [ ] Escrever mensagem
- [ ] Ativar aviso
- [ ] Salvar

### 13.2 Verificação no Cliente
- [ ] Fazer login como cliente
- [ ] Verificar banner de aviso no dashboard
- [ ] Verificar mensagem correta

### 13.3 Desativar
- [ ] Desativar aviso no admin
- [ ] Verificar ausência no dashboard cliente

---

## Fase 14: Casos Extremos

### 14.1 Conflito de Horários
- [ ] Agendar serviço de 60 min em horário de 30 min
- [ ] Verificar conflito avisado
- [ ] Agendar dois clientes mesmo horário
- [ ] Segundo horário deve estar bloqueado

### 14.2 Cancelamento Admin
- [ ] Admin cancela agendamento
- [ ] WhatsApp enviado para cliente

### 14.3 Dados Inválidos
- [ ] Tentar agendar em dia passado
- [ ] Verificar dia bloqueado

---

## Fase 15: Funcionalidades Técnicas

### 15.1 Cache Offline (PWA)
- [ ] Acessar app sem internet
- [ ] Verificar funcionando (dados em cache)
- [ ] Restaurar internet
- [ ] Verificar sincronização

### 15.2 Responsividade
- [ ] Abrir no celular
- [ ] Verificar layout responsivo
- [ ] Menu hamburger funciona

### 15.3 Segurança
- [ ] Acessar admin sem login
- [ ] Verificar redirecionamento para login
- [ ] Tentar acessar via URL
- [ ] Verificar acesso negado

---

## Checklist Final

| # | Teste | Status |
|---|------|--------|
| 1 | Login cliente | [ ] |
| 2 | Login admin | [ ] |
| 3 | Recuperação de senha | [ ] |
| 4 | Cadastro cliente | [ ] |
| 5 | Agendamento completo | [ ] |
| 6 | WhatsApp notificação | [ ] |
| 7 | Cancelar agendamento | [ ] |
| 8 | Admin confirmar | [ ] |
| 9 | Admin cancelar | [ ] |
| 10 | Admin.confirmações WhatsApp | [ ] |
| 11 | Criar serviço | [ ] |
| 12 | Editar serviço | [ ] |
| 13 | Excluir serviço | [ ] |
| 14 | Configurar horários | [ ] |
| 15 | Criar bloqueio | [ ] |
| 16 | Remover bloqueio | [ ] |
| 17 | Ver clientes | [ ] |
| 18 | Criar/desativar aviso | [ ] |
| 19 | Responsividade | [ ] |
| 20 | Cache offline | [ ] |

---

## Relatório de Bugs

| # | Data | Bug | Severidade | Status |
|---|------|-----|-----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

*Documento criado em: 29/04/2026*