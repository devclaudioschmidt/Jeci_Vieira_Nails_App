# Jeci Vieira Nails - Aplicativo de Agendamentos

Sistema de agendamento online para salão de beleza.

---

## Funcionalidades Implementadas

### 1. Autenticação
- Login/Cadastro de clientes via Firebase Authentication
- Login de Administrador com role="admin"
- Recuperação de senha

---

### 2. Agendamento (Cliente)

#### Seleção de Serviços
- Lista de serviços cadastrados pelo admin
- Exibição de nome, ícone, preço e duração
- Seleção com highlighted visual

#### Calendário
- Navegação por meses (anterior/próximo)
-/blockeio de dias passados
-.blockeio de dias configured como fechados (domingo)
- Exibição visual de dias com agendamentos

####Horário
- Geração automática baseada em configurações do salão
- Intervalo de almoço configurável
-.blockeio de horários já ocupados
-.blockeio de horários manualmente bloqueados pelo admin
- Verificação de conflito com duração do serviço

#### Confirmação
- Modal de sucesso com detalhes do agendamento
- Dados: Serviço, Data, Horário, Duração, Valor
- Redirecionamento para dashboard

---

### 3. Histórico (Cliente)

#### Lista de Agendamentos
- Agendamentos futuros e passado
- Status: Pendente, Confirmado, Cancelado

#### Ações
- **Cancelar**: Modal de confirmação → status = "cancelado"
- **Reagendar** (com 24h de antecedência):
  - Se +24h → redireciona para agendamento.js com params
  - Se -24h → modal alertando para contactar admin

---

### 4. Painel Admin

#### Dashboard
- Calendário visual com dias e agendamentos
- Lista de agendamentos do dia
- Status visual (pendente/confirmado/cancelado)

#### Serviços
- Criar/Editar/Excluir serviços
- Campos: Nome, Descrição, Preço, Duração, Ícone
- Ativo/Inativo

#### Configurações do Salão
- **Horários de funcionamento** (por dia da semana)
  - Segunda: Abertura, Intervalo, Fechamento
  - Sábado: Abertura, Fechamento
  - Domingo: Fechadoou Aberto
- **Tempo entre agendamentos** (min)
- **Telefone**
- **Endereço**

#### Bloqueios de Horários
- Criar bloqueio manual: Data, Hora Início, Hora Fim, Motivo
- Lista de bloqueios com opção de desbloquear
- Verificação de conflito com agendamentos existentes

#### Clientes
- Lista de clientes cadastrados
- Dados: Nome, Email, Telefone, CPF, Data Nascimento

#### Avisos
- Ativar/Desativar mensagem para todos os clientes

---

### 5. Funcionalidades Técnicas

#### Firestore Rules
- Admin: acesso total
- Cliente: apenas dados próprios
- Leitura de agendamentos para verificação de horários

#### Índices Firestore
- Query composta: data + status para buscar horários do dia

#### Modais Personalizados
- Sistema de modais padronizados (admin.js)
- Sistema de modais padronizados (agendamento.js)
- Fundo escuro (80% opacidade)
- Card branco
- Estilorose-gold

#### Sistema de Intervalo de Almoço
- O sistema pula para depois do intervalo quando o serviço terminaria durante ele
- O serviço deve terminar ANTES do início do intervalo

#### Sistema de Conflito de Horários
-.blockeia horário que começa durante outro agendamento
-.blockeia horário que terminaria após o início de outro agendamento

---

## Estrutura de Arquivos

```
/
├── assets/js/
│   ├── auth.js          # Autenticação
│   ├── agendamento.js   # Página de agendamento
│   ├── historico.js     # Histórico do cliente
│   ├── dashboard.js     # Dashboard cliente
│   └── admin.js         # Paineladmin
├── pages/
│   ├── index.html      # Login/Cadastro
│   ├── cadastro.html  # Cadastro
│   ├── dashboard.html # Dashboard cliente
│   ├── historico.html # Histórico
│   ├── agendamento.html# Agendamento
│   └── admin/          # Paineladmin
├── css/
│   ├── style-login.css
│   ├── style-dashboard.css
│   ├── style-historico.css
│   ├── style-agendamento.css
│   └── style-admin.css
└── data/
    └── firestore.rules # Regras de segurança
```

---

## Configurações do Firestore

### Collections

#### `usuarios/{userId}`
```javascript
{
  nome: string,
  email: string,
  telefone: string,
  cpf: string,
  dataNascimento: string,
  dataCadastro: timestamp,
  role: "cliente" | "admin"
}
```

#### `agendamentos/{agendamentoId}`
```javascript
{
  servico: string,
  servicoId: string,
  preco: number,
  duracao: number,
  data: string, // YYYY-MM-DD
  horario: string, // HH:MM
  status: "pendente" | "confirmado" | "cancelado",
  observacoes: string,
  userId: string,
  clienteNome: string,
  createdAt: timestamp,
  // Campos opcionais
  reagendadoDe: string,
  motivoReagendamento: string,
  canceledAt: timestamp
}
```

#### `servicos/{servicoId}`
```javascript
{
  nome: string,
  descricao: string,
  preco: number,
  duracao: number,
  icone: string,
  ativo: boolean
}
```

#### `configuracoes/salao`
```javascript
{
  segundaAbertura: string,
  segundaIntervaloInicio: string,
  segundaIntervaloFim: string,
  segundaFechamento: string,
  sabadoAbertura: string,
  sabadoFechamento: string,
  domingoFechado: boolean,
  telefone: string,
  endereco: string,
  tempoEntreAgendamentos: number,
  horariosBloqueados: [
    {
      id: string,
      data: string,
      horaInicio: string,
      horaFim: string,
      motivo: string
    }
  ]
}
```

#### `avisos/{avisoId}`
```javascript
{
  mensagem: string,
  ativo: boolean
}
```

---

## Regras de Segurança (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && get(...).data.role == 'admin';
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /agendamentos/{agendamentoId} {
      allow read, write, delete: if request.auth != null && get(...).data.role == 'admin';
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /servicos/{servicoId} {
      allow read: if request.auth != null;
      allow create, write, delete: if request.auth != null && get(...).data.role == 'admin';
    }
    
    match /configuracoes/{configId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(...).data.role == 'admin';
    }
    
    match /avisos/{avisoId} {
      allow read: if request.auth != null;
      allow create, write, delete: if request.auth != null && get(...).data.role == 'admin';
    }
  }
}
```

---

## Índices Firestore

### `agendamentos`
- **Campos**: data (asc), status (asc)
- **Propósito**: Buscar agendamentos do dia filtrando por status

---

## Histórico de Atualizações

### v1.0 - features Principais
- Autenticação Firebase
- Agendamento com seleção de serviço, data e horário
- Dashboard cliente com histórico
- Painel Admin completo

### v1.1 - Correções Backend
- Salvamento no Firestore
- Limits de agendamentos
- Busca de serviços
- Configurações do salão

### v1.2 - Correções Frontend
- Correção de clienteId para userID
- Upgrade Firebase SDK
- Correção de syntax error
- Padronização de código

### v1.3 - Layout
- Alinhamento de rodapé (480px/600px)

### v1.4 - Funcionalidades
- Máscara de telefone
- Intervalo = 0
- Horários de 30min
- Validação de fechamento

### v1.5 - Sistema de Bloqueio
- Índice Firestore para查询 composta
-.blockeio de horários occupados
-.blockeio baseado na duração do serviço

### v1.6 - Regras de Segurança
- firestore.rules implementadas
- Permissões por role

### v1.7 - Modais
- Sistema de modais padronizados (admin)
- Sistema de modais padronizados (agendamento)

### v1.8 - Cancelar/Reagendar
- Botão Cancelar no histórico do cliente
- Botão Reagendar (24h de antecedência)
- Modal de detalhes no admin
- Cancelar/Reagendar no admin

### v1.9 - Intervalo de Almoço
- Sistema pula para depois do intervalo quando o serviço terminaria durante ele
- O serviço deve terminar ANTES do início do intervalo

### v1.10 - Conflito de Horários
-.blockeia horário que começa durante outro agendamento
-.blockeia horário que terminaria após o início de outro agendamento