# Jeci Vieira Nails - Sistema de Agendamento

Sistema de agendamento online para salão de manicure e podologia.

## Como usar

Basta abrir o arquivo `index.html` no navegador!

### Opções de hospedagem gratuita:

1. **GitHub Pages** (recomendado)
   - Faça upload dos arquivos para um repositório GitHub
   - Vá em Settings > Pages > selecione a branch main
   - Seu site estará online em: `seu-usuario.github.io/nome-do-repo`

2. **Netlify**
   - Arraste a pasta com os arquivos para netlify.com/drop
   - Pronto! Você terá um link gratuito

3. **Vercel**
   - Conecte seu repositório GitHub
   - Deploy automático

## Como editar serviços

Abra o arquivo `script.js` e procure a seção `// DADOS DOS SERVIÇOS`. 

### Adicionar novo serviço:

```javascript
{
    id: "novo-servico",        // ID único (sem espaços, use hífem)
    category: "manicure",       // Categoria: "manicure" ou "podologia"
    name: "Nome do Serviço",     // Nome que aparece na tela
    description: "Descrição",     // Descrição breve
    price: 100,                 // Preço em reais
    duration: 60,               // Duração em minutos
    badge: "Popular",           // "Popular", "Recomendado" ou null
    icon: "hand"                // Ícone: hand, hands, bottle, etc
}
```

### Adicionar nova categoria:

```javascript
{
    id: "nova-categoria",       // ID único
    name: "Nome da Categoria",   // Nome que aparece
    description: "Descrição",     // Descrição
    icon: "nails"               // Ícone: nails ou foot
}
```

### Alterar horário de funcionamento:

No arquivo `script.js`, procure:

```javascript
const AVAILABLE_TIMES = ['08:00', '09:00', '10:00', ...];
const UNAVAILABLE_TIMES = []; // Horários bloqueados
```

### Alterar número do WhatsApp:

```javascript
const WHATSAPP_NUMBER = '5511999999999';
```

Substitua pelo seu número com código do país (55) + DDD + número.

## Estrutura de arquivos

```
├── index.html       # Página principal
├── script.js        # Lógica + dados dos serviços
└── assets/
    └── style.css    # Estilos visuais
```

## Ícones disponíveis

**Categorias:** `nails`, `foot`

**Serviços:** `hand`, `hands`, `bottle`, `longnail`, `foot`, `spa`, `circle`, `brace`

## Funcionalidades

- Visualização de categorias
- Lista de serviços com preços
- Calendário interativo
- Seleção de horários
- Envio via WhatsApp
- Design responsivo (mobile-first)
- Animações suaves
