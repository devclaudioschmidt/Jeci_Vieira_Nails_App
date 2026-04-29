# Jeci Vieira Nails - Documentação Completa do Projeto

## 1. Informações Gerais

| Campo | Valor |
|-------|-------|
| **Nome do Projeto** | Jeci Vieira Nails |
| **Aplicativo** | Sistema de agendamento online para salão de beleza |
| **Branch Atual** | main, developer, correcoes-backend |
| **Última Atualização** | 29/04/2026 |
| **Repositório** | GitHub (devclaudioschmidt/Jeci_Vieira_Nails_App) |

---

## 2. Tecnologias e Ferramentas

### 2.1 Backend
| Serviço | Função |
|---------|-------|
| **Firebase Auth** | Autenticação de usuários (email/senha) |
| **Firebase Firestore** | Banco de dados NoSQL |
| **Firebase Hosting** | Hospedagem de arquivos estáticos |

### 2.2 Frontend
| Tecnologia | Função |
|------------|--------|
| **HTML5** | Estrutura das páginas |
| **CSS3** | Estilização (variáveis CSS, design responsivo) |
| **JavaScript (ES6+)** | Lógica client-side |
| **Firebase SDK** | Integração com Firebase |

### 2.3 Funcionalidades Extras
| Recurso | Função |
|---------|-------|
| **PWA (Service Worker)** | Cache offline para funcionamento sem internet |
| **WhatsApp API** | Mensagens automáticas de confirmação |

---

## 3. Estrutura de Arquivos

```
Jeci_Vieira_Nails_App/
├── index.html                    # Página inicial (login)
├── README.md                     # Documentação geral
├── RESUMO_PROJETO.md            # Resumo de correções
├── firebase.json                # Configuração Firebase
├── pages/
│   ├── admin.html              # Painel do administrador
│   ├── agendamento.html       # Página de agendamento
│   ├── cadastro.html          # Página de cadastro
│   ├── dashboard.html        # Dashboard do cliente
│   ├── esqueci-senha.html     # Recuperação de senha
│   ├── historico.html         # Histórico de agendamentos
│   └── perfil.html           # Perfil do cliente
├── assets/
│   ├── js/
│   │   ├── admin.js          # Lógica do Admin
│   │   ├── agendamento.js   # Lógica de agendamento
│   │   ├── auth.js          # Autenticação
│   │   ├── cadastro.js     # Cadastro de clientes
│   │   ├── dashboard.js   # Dashboard
│   │   ├── firebase-config.js  # Config Firebase
│   │   ├── historico.js   # Histórico
│   │   ├── login.js       # Login
│   │   ├── perfil.js     # Perfil
│   │   ├── sw.js        # Service Worker (PWA)
│   │   └── sw-register.js  # Registro do SW
│   └── css/
│       ├── style-admin.css
│       ├── style-agendamento.css
│       ├── style-dashboard.css
│       ├── style-esqueci-senha.css
│       ├── style-historico.css
│       ├── style-login.css
│       └── style-perfil.css
├── css/
│   └── style.css             # Estilos globais
├── data/
│   ├── firestore.rules     # Regras de segurança
│   └── firestore.indexes.json  # Índices Firestore
└── Documentacoes/
    ├── documentacao_completa.md  # Este arquivo
    ├── FrontEnd_Clientes.md
    ├── logica_whatsapp.md
    └── regras.md
```

---

## 4. Recursos do Sistema

### 4.1 Autenticação

| Recurso | Descrição |
|--------|---------|
| **Login** | Email e senha via Firebase Auth |
| **Cadastro** | Nome, email, telefone, senha |
| **Recuperação de Senha** | Envio de email de redefinição |
| **Logout** | Sair da conta |
| **Proteção de Rotas** | Apenas usuários logados acessam áreas internas |

### 4.2 Agendamento (Cliente)

| Recurso | Descrição |
|--------|---------|
| **Seleção de Serviços** | Lista de serviços cadastrados pelo admin |
| **Informações do Serviço** | Nome, ícone, preço, duração |
| **Calendário** | Navegação por meses, dias bloqueados/passados |
| **Dias Fechados** | Domingo e outros configurados |
| **Geração de Horários** | Automática baseada em configurações |
| **Bloqueio de Intervalo** | Intervalo de almoço configurável |
| **Horários Ocupados** | Bloqueados automaticamente |
| **Horários Manuais** | Bloqueios pelo admin |
| **Verificação de Conflito** | Considera duração do serviço |
| **Confirmação** | Modal com dados do agendamento |
| **Notificação WhatsApp** | Admin recebe mensagem automática |

### 4.3 Histórico (Cliente)

| Recurso | Descrição |
|--------|---------|
| **Lista de Agendamentos** | Futuros e passados |
| **Status** | Pendente, Confirmado, Cancelado |
| **Cancelar** | Botão para cancelar agendamento |
| **Detalhes** | Serviço, data, horário, valor |

### 4.4 Perfil (Cliente)

| Recurso | Descrição |
|--------|---------|
| **Dados Pessoais** | Nome, email, telefone |
| **Edição** | Atualizar informações |
| **Alteração de Senha** | Via Firebase Auth |

### 4.5 Dashboard (Cliente)

| Recurso | Descrição |
|--------|---------|
| **Boas-vindas** | Nome do cliente |
| **Próximo Agendamento** | Próxima data/horário |
| **Lista Recentas** | Agendamentos recentes |
| **Acesso Rápido** | Agendar novo |

---

## 5. Painel Admin

### 5.1 Seções do Menu

| Seção | Ícone | Descrição |
|-------|-------|-----------|
| **Solicitações** | 🔔 | Agendamentos pendentes |
| **Confirmações** | ✅ | Agendamentos próximos (próximos 3 dias) |
| **Agenda** | 📅 | Calendário com agendamentos |
| **Serviços** | 💅 | Gerenciar serviços |
| **Clientes** | 👥 | Lista de clientes |
| **Avisos** | 📢 | Mensagem para clientes |
| **Bloqueios** | 🔒 | Horários bloqueados |
| **Configurações** | ⚙️ | Configurações do salão |

### 5.2 Funcionalidades do Admin

| Recurso | Descrição |
|--------|---------|
| **Dashboard** | Calendário visual, lista do dia |
| **Confirmações** | Lista de下次dimentos próximos com WhatsApp |
| **Serviços** | Criar/Editar/Excluir serviços |
| **Configurações** | Horários por dia, intervalo, telefone, endereço |
| **Bloqueios** | Criar/Remover bloqueios manuais |
| **Clientes** | Lista completa |
| **Avisos** | Mensagem ativa para todos |

---

## 6. Regras de Negócio

### 6.1 Funcionamento por Dia

| Dia | Status | Horário |
|-----|--------|---------|
| Segunda | Configurável | Abertura → Intervalo → Fechamento |
| Terça | Configurável | Abertura → Fechamento |
| Quarta | Configurável | Abertura → Fechamento |
| Quinta | Configurável | Abertura → Fechamento |
| Sexta | Configurável | Abertura → Fechamento |
| Sábado | Configurável | Abertura → Fechamento |
| Domingo | Fechado/Aberto | - |

### 6.2 Intervalo Entre Agendamentos
- Configurável em minutos (ex: 15, 30, 60)
- Padrão: 15 minutos

### 6.3 Regras de Cancelamento
- Cliente pode cancelar próprio agendamento
- Admin pode cancelar qualquer agendamento
- Após cancelar, horário fica disponível

### 6.4 Regras de Confirmação
- Admin pode confirmar via sistema
- Admin pode confirmar via WhatsApp

---

## 7. Coleções do Firestore

### 7.1 Estrutura de Dados

| Collection | Dados |
|------------|-------|
| **usuarios** | uid, nome, email, telefone, role (admin/cliente), createdAt |
| **agendamentos** | uid, userId, servico, servicoId, data, horario, duracao, preco, status, createdAt |
| **servicos** | nome, descricao, preco, duracao, icone, ativo |
| **configuracoes** | horarios por dia, intervalo, telefone, endereco, bloqueios |
| **avisos** | mensagem, ativo, createdAt |

### 7.2 Regras de Segurança

| Collection | Admin | Cliente |
|------------|-------|---------|
| usuarios | read/write (próprio) | read/write (próprio) |
| agendamentos | read/write/delete | create, read, update (próprio), delete (próprio) |
| servicos | read/create/write/delete | read |
| configuracoes | read/write | read |
| avisos | read/create/write/delete | read |

---

## 8. Fluxo de Uso

### 8.1 Fluxo Cliente

```
1. Abrir app → Login
2. Não tem conta? → Cadastro
3. Logado → Dashboard
4. Clicar "Agendar novo"
5. Selecionar serviço
6. Escolher data no calendário
7. Escolher horário disponível
8. Confirmar → Sucesso
9. Receber código no WhatsApp (admin notificado)
```

### 8.2 Fluxo Admin

```
1. Abrir app → Login admin
2. Ver "Solicitações" → Ver agendamentos pendentes
3. Aprovar/Rejeitar →	Status atualizado
4. Ver "Confirmações" → Agendamentos dos próximos dias
5. Confirmar via WhatsApp →	Mensagem automática
6. Gerenciar serviços, configurações, bloqueios
```

---

## 9. Histórico de Versões

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | 28/04/2026 | Sistema inicial |
| 1.1 | 29/04/2026 | Remoção de push notifications |
| 1.2 | 29/04/2024 | Seção Confirmações |
| 1.3 | 29/04/2026 | Correção de bugs |

---

## 10. Contato e Suporte

| Campo | Valor |
|-------|-------|
| **Desenvolvedor** | Claudio Schmidt |
| **Email** | cs.claudioschmidt@gmail.com |
| **GitHub** | github.com/devclaudioschmidt/Jeci_Vieira_Nails_App |
| **Firebase Console** | console.firebase.google.com/project/jeci-vieira-nails |

---

## 11. Como Executar Localmente

### 11.1 Usando Live Server (VS Code)

1. Abrir pasta no VS Code
2. Clicar com botão direito em `index.html`
3. Selecionar "Open with Live Server"
4. Acessar `http://127.0.0.1:5500`

### 11.2 Usando http-server

```bash
npx http-server . -p 8080
```

### 11.3 Produção

- Deploy automático via GitHub Actions
- URL: https://jeci-vieira-nails.firebaseapp.com

---

*Documento gerado em: 29/04/2026*