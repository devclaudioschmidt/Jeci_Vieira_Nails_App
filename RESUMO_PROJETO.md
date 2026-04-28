# Jeci Vieira Nails App - Resumo do Projeto

## Branch Atual: correcoes-backend

### Correções Aplicadas

| # | Commit | Arquivo | Correção |
|---|--------|--------|---------|
| 1 | 04e6cb7 | `agendamento.js` | Salvamento no Firestore ativado |
| 2 | 892ae3f | `admin.js` | limit(50) nas consultas |
| 3 | 23a64d8 | `agendamento.js` | Buscar serviços do Firestore |
| 4 | 5b9e513 | `agendamento.js` | Usar variável configuracoes global |
| 5 | 191012d | `dashboard.js` | clienteId → userId |
| 6 | 191012d | `historico.html` | Firebase SDK 9.6.1 → 9.23.0 |
| 7 | 266e443 | `historico.js` | Corrigir syntax error (escapes) |
| 8 | 3d0e362 | `historico.html/js/css` | Padronizar pagina Meus Agendamentos |
| 9 | 811102e | `style-dashboard.css` | Alinhar largura do rodape (480px) |
| 10 | 811102e | `style-admin.css` | Alinhar largura do rodape (600px) |
| 11 | c1872bd | `admin.js` | Mascara de telefone |
| 12 | 8ace68a | `admin.js` | Atualizar rodape em tempo real |
| 13 | 2bba33e | `admin.js` | Permitir valor 0 no intervalo |
| 14 | ba3d3e8 | `agendamento.js` | Gerar horarios de 30 em 30 min |
| 15 | fc1e736 | `agendamento.js` | Validar horario que ultrapassa fechamento |

---

## Pendências / To-Do

### 1. índice Firestore (Pendente)
- **Problema:** Query composta `.where('data').where('status')` precisa de índice composto
- **Solução:** Criar índice no console Firebase
- **Campos:** data (crescente) + status (crescente)
- **Collection:** agendamentos

### 2. Horários Occupados Não São Bloqueados (Pendente)
- **Causa:** Falta índice composto no Firestore
- **Após criar índice:** Testar novamente

---

## Como Testar as Correções

### Cenário 1: Agendamento
1. Login como cliente
2. Agendar serviço
3. Selecionar data → Verificar horarios (30 em 30)
4. Confirmar
5. Tentar agendar novamente na mesma data
6. Verificar se horário occupado está bloqueado

### Cenário 2: Admin
1. Login como admin
2. Verificar painéis (solicitações, agenda, clientes)
3. Configurações → Testar máscara telefone
4. Intervalo → Testar valor 0

---

## Configurações Firebase

- **Projeto:** jeci-vieira-nails
- **Auth:** Firebase Auth (email/senha)
- **DB:** Cloud Firestore
- **Regras:** Pendente criar firestore.rules

---

## Estrutura de Arquivos

```
/
├── pages/
│   ├── index.html (login)
│   ├── dashboard.html
│   ├── agendamento.html
│   ├── historico.html
│   ├── perfil.html
│   ├── admin.html
│   ├── cadastro.html
│   └── esqueci-senha.html
├── assets/js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── agendamento.js (corrigido)
│   ├── dashboard.js
│   ├── historico.js
│   ├── perfil.js
│   └── admin.js
├── css/
│   ├── style-dashboard.css
│   ├── style-agendamento.css
│   ├── style-historico.css
│   ├── style-perfil.css
│   └── style-admin.css
├── data/img/
│   └── Logo_JeciVieira_NailsDesigner.svg
└── skills/
    ├── regras-backend.md
    ├── regras-frontend.md
    └── regras-firestore.md
```

---

## Próximos Passos (para continuar de casa)

1. **Criar índice Firestore:**
   - Firebase Console → Firestore → Índices
   - Adicionar: collection=agendamentos, campos=data,status

2. **Testar horários occupados:**
   - Agendar dois horários na mesma data
   - Verificar se segundo é bloqueado

3. **Criar firestore.rules** (segurança)

4. **Criar PR para developer** (mergiar branch)

---

## Contato / Suporte

- **Dono do projeto:** Claudio Schmidt
- **Repositório:** GitHub
- **Branch de trabalho:** correcoes-backend

---

*Última atualização: 28/04/2026*