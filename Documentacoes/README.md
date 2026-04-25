# 📋 JEICI VIEIRA NAILS - README

## 📱 Projeto: Jeci Vieira Nails App

Plataforma de agendamento premium para salão de manicure.

---

## ✨ Funcionalidades Implementadas

### 1. Autenticação
- ✅ **Login** - Autenticação com email/senha
- ✅ **Cadastro** - Criação de nova conta
- ✅ **Recuperação de Senha** - Via email Firebase
- ✅ **Proteção de Rotas** - Bloqueio de acesso não-logado
- ✅ **Redirect por Role** - Admin vs Cliente

### 2. Páginas
| Página | Caminho | Descrição |
|--------|--------|----------|
| Login | `/index.html` | Página principal de login |
| Cadastro | `/pages/cadastro.html` | Criação de nova conta |
| Esqueci Senha | `/pages/esqueci-senha.html` | Recuperação de senha |
| Dashboard | `/pages/dashboard.html` | Área do cliente |
| Admin | `/pages/admin.html` | Área do administrador |
| Perfil | `/pages/perfil.html` | Dados do usuário |

### 3. Dados do Usuário (Firestore)
- Nome
- Email
- Telefone (novo)
- Data de Nascimento (novo)
- Role (cliente/admin)

### 4. Recursos UI/UX
- Design Glassmorphism
- Paleta Rose Gold (#B76E79)
- Fontes: Playfair Display + Montserrat
- Mensagens de feedback no topo (estilo notificação)
- Responsivo Mobile-First
- PWA compatível

### 5. Armazenamento
- Firebase Auth (autenticação)
- Firebase Firestore (banco de dados)

---

## 📂 Estrutura de Arquivos

```
/
├── index.html                    # Login
├── css/
│   ├── style-login.css          # Estilos login
│   ├── style-dashboard.css     # Estilos dashboard
│   └── style-admin.css          # Estilos admin
├── assets/
│   ├── js/
│   │   ├── firebase-config.js # Config Firebase
│   │   ├── auth.js             # Autenticação
│   │   ├── auth-guard.js      # Proteção rotas
│   │   ├── login.js           # Imagem background
│   │   ├── index.js           # Lógica login
│   │   ├── cadastro.js        # Lógica cadastro
│   │   ├── esqueci-senha.js  # Recuperação senha
│   │   ├── perfil.js          # Perfil usuário
│   │   ├── dashboard.js       # Dashboard cliente
│   │   ├── admin.js           # Dashboard admin
│   │   └── sw-register.js    # PWA
│   └── manifest/              # Manifest PWA
├── data/
│   └── img/                   # Imagens
└── pages/
    ├── cadastro.html          # Cadastro
    ├── esqueci-senha.html    # Esqueci senha
    ├── dashboard.html         # Dashboard
    ├── admin.html           # Admin
    └── perfil.html          # Perfil
```

---

## 🔧 Tecnologias

- HTML5 / CSS3
- JavaScript (ES6+)
- Firebase (Auth + Firestore)
- PWA (Progressive Web App)

---

## 🚀 Como Executar

1. Clone o repositório
2. Configure o Firebase (console.firebase.google.com)
3. Ative Authentication (Email/Senha)
4. Configure as regras do Firestore
5. Abra no navegador

---

## 📝 Variáveis CSS (style-login.css)

```css
:root {
    --cor-fundo-pagina: #FFF9F6;
    --rose-gold: #C98B8B;
    --rose-gold-claro: #E8C4C4;
    --fonte-titulo: 'Playfair Display', serif;
    --fonte-texto: 'Montserrat', sans-serif;
}
```

---

## 👤 Autor

ClaudioSchmidt.Dev

---

## 📄 Licença

Claudio Schmidt Serviços de Desenvolvimento Ltda.
     ->> Todos os direitos reservados <<-

---

**Versão: 1.0**
**Data: Abril 2025**