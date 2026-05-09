# Estrutura do Banco de Dados - Firestore

**Projeto:** `jeci-vieira-nails`
**SDK:** Firebase v9 compat

---

## Coleção: `usuarios`

**Estratégia de ID:** 
- No cadastro normal: o ID é o **UID do Firebase Auth** (`userCredential.user.uid`)
- Quando admin cria cliente: ID **auto-gerado** pelo `add()`, vinculado ao Auth via campo `uidAuth`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | `string` | Sim | Nome completo |
| `email` | `string` | Sim | E-mail de login |
| `telefone` | `string` | Não | Telefone (formato BR) |
| `role` | `string` | Sim | `"cliente"` ou `"admin"` |
| `dataCadastro` | `Timestamp` | Sim | `serverTimestamp()` |
| `uidAuth` | `string` | Condicional | Só existe quando admin cria o cliente (link com Auth) |
| `cpf` | `string` | Não | Cadastro opcional |
| `dataNascimento` | `string` | Não | Formato `DD/MM/AAAA` |

---

## Coleção: `agendamentos`

**Estratégia de ID:** **Auto-gerado** por `add()`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `servico` | `string` | Sim | Nome do serviço (desnormalizado) |
| `servicoId` | `string` | Sim | ID do documento em `servicos` |
| `servicoNome` | `string` | Sim | Mesmo que `servico` (duplicado) |
| `preco` | `number` | Sim | Valor em R$ |
| `duracao` | `number` | Sim | Duração em minutos |
| `data` | `string` | Sim | Formato `YYYY-MM-DD` |
| `horario` | `string` | Sim | Formato `HH:MM` |
| `status` | `string` | Sim | `"pendente"`, `"confirmado"` ou `"cancelado"` |
| `userId` | `string` | Sim | ID do documento em `usuarios` |
| `clienteNome` | `string` | Sim | Nome do cliente (desnormalizado) |
| `clienteTelefone` | `string` | Não | Telefone do cliente (desnormalizado) |
| `observacoes` | `string` | Não | Observações opcionais |
| `createdAt` | `Timestamp` | Sim | `serverTimestamp()` |
| `updatedAt` | `Timestamp` | Condicional | Só existe após confirmação/cancelamento |
| `criadoPor` | `string` | Condicional | UID do admin quando criado por ele |
| `reagendadoDe` | `string` ou `null` | Condicional | ID do agendamento original (reagendamento) |

---

## Coleção: `servicos`

**Estratégia de ID:** **Auto-gerado** por `add()`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | `string` | Sim | Nome do serviço |
| `descricao` | `string` | Não | Descrição opcional |
| `preco` | `number` | Sim | Valor em R$ |
| `duracao` | `number` | Sim | Duração em minutos (padrão 60) |
| `icone` | `string` | Não | Emoji (padrão `"💅"`) |
| `ativo` | `boolean` | Sim | Controla visibilidade no app |
| `createdAt` | `Timestamp` | Condicional | Só na criação |
| `updatedAt` | `Timestamp` | Condicional | Só na atualização |

---

## Coleção: `configuracoes`

**Estratégia de ID:** **Fixo** — documento único com ID `"salao"`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `segundaAbertura` | `string` | Sim | `HH:MM` (padrão `"09:00"`) |
| `segundaIntervaloInicio` | `string` | Sim | `HH:MM` (padrão `"12:00"`) |
| `segundaIntervaloFim` | `string` | Sim | `HH:MM` (padrão `"13:00"`) |
| `segundaFechamento` | `string` | Sim | `HH:MM` (padrão `"19:00"`) |
| `sabadoAbertura` | `string` | Sim | `HH:MM` (padrão `"09:00"`) |
| `sabadoFechamento` | `string` | Sim | `HH:MM` (padrão `"17:00"`) |
| `domingoFechado` | `boolean` | Sim | Padrão `true` |
| `telefone` | `string` | Não | Telefone do salão |
| `endereco` | `string` | Não | Endereço do salão |
| `tempoEntreAgendamentos` | `number` | Sim | Folga entre horários (minutos, padrão 15) |
| `horariosBloqueados` | `array` | Não | Array de objetos (ver abaixo) |
| `updatedAt` | `Timestamp` | Não | `serverTimestamp()` |

### Estrutura de `horariosBloqueados` (array):

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | `'bloq_' + Date.now()` |
| `data` | `string` | Formato `YYYY-MM-DD` |
| `horaInicio` | `string` | Formato `HH:MM` |
| `horaFim` | `string` | Formato `HH:MM` |
| `motivo` | `string` | Opcional |

---

## Coleção: `avisos`

**Estratégia de ID:** **Auto-gerado** por `add()`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `mensagem` | `string` | Sim | Texto do aviso (max 300 caracteres) |
| `ativo` | `boolean` | Sim | Controla exibição |
| `createdAt` | `Timestamp` | Condicional | Só na criação |
| `updatedAt` | `Timestamp` | Condicional | Só na atualização |

---

## Coleção: `notificacoes`

**Estratégia de ID:** **Auto-gerado** por `add()`.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `uid` | `string` | Sim | UID do usuário destinatário |
| `titulo` | `string` | Sim | Título da notificação |
| `mensagem` | `string` | Sim | Corpo da notificação |
| `tipo` | `string` | Sim | Ex: `"info"`, `"confirmado"` |
| `lida` | `boolean` | Sim | Sempre `false` na criação |
| `createdAt` | `Timestamp` | Sim | `serverTimestamp()` |

---

## Resumo das Coleções

| # | Coleção | Estratégia de ID | Documentos |
|---|---|---|---|
| 1 | `usuarios` | Auth UID ou auto-gerado + `uidAuth` | Múltiplos |
| 2 | `agendamentos` | Auto-gerado | Múltiplos |
| 3 | `servicos` | Auto-gerado | Múltiplos |
| 4 | `configuracoes` | **Fixo:** `"salao"` | **Único** |
| 5 | `avisos` | Auto-gerado | Múltiplos |
| 6 | `notificacoes` | Auto-gerado | Múltiplos |

> **Nota:** Nenhuma subcoleção foi encontrada no código. Todas as coleções são top-level.
> Todos os timestamps usam `firebase.firestore.FieldValue.serverTimestamp()`.
> Nenhum `onSnapshot()` (real-time listener) é utilizado — apenas `get()` (consultas únicas).
