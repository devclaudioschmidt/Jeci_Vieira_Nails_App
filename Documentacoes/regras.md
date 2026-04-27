# Regras do Firestore - Jeci Vieira Nails

Este arquivo contém as regras de segurança do Firebase Firestore.

---

## Como usar

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto: **jeci-vieira-nails**
3. Menu: **Firestore Database** → aba **Regras**
4. Cole o código abaixo
5. Clique em **Publicar**

---

## Código das Regras

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // USUÁRIOS
    // ============================================
    // Usuário acessa e modifica apenas seus próprios dados
    match /usuarios/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    
    // ADMIN pode fazer tudo em TODOS os usuários
    match /usuarios/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ============================================
    // SERVIÇOS
    // ============================================
    // Qualquer pessoa pode ler (exibir na dashboard)
    // Apenas admin pode criar/editar
    match /servicos/{servicoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ============================================
    // CONFIGURAÇÕES
    // ============================================
    // Leitura pública (clientes consultam horários)
    // Apenas admin modifica
    match /configuracoes/{configId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ============================================
    // AVISOS
    // ============================================
    // Leitura pública (mensagens aos clientes)
    // Apenas admin cria/edita
    match /avisos/{avisoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
    // ============================================
    // AGENDAMENTOS
    // ============================================
    // Usuários logados podem ler e criar
    // Apenas admin pode atualizar e excluir (para gestão via painel admin)
    match /agendamentos/{agendamentoId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
  }
}
```

---

## Explicação das Regras

### Coleções e Suas Permissões

| Coleção | Ler | Criar | Atualizar | Excluir |
|--------|-----|------|---------|--------|
| `usuarios/{uid}` | Próprio | Próprio | Próprio | Próprio |
| `usuarios/{document=**}` | Admin | Admin | Admin | Admin |
| `servicos` | Todos | Admin | Admin | Admin |
| `configuracoes` | Todos | Admin | Admin | Admin |
| `avisos` | Todos | Admin | Admin | Admin |
| `agendamentos` | Todos | Todos | Admin | Admin |

### Como funciona a verificação de admin

O código usa `get()` para buscar o documento do usuário e verificar o campo `role`:

```javascript
get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin'
```

Isso:
1. Busca o documento do usuário autenticado (`/usuarios/uid_do_usuario`)
2. Verifica se o campo `role` é igual a `"admin"`
3. Permite o acesso se for verdadeiro

---

## Regras Antigas (Referência)

Versão anterior não permitia exclusão de clientes e agendamentos via painel admin.

---

## Observações importantes

- O campo `role` deve existir no documento do usuário no Firestore
- Valores válidos: `"cliente"` ou `"admin"`
- A verificação é feita no documento, não no token JWT

---

**Data de criação:** Abril 2025
**Última atualização:** Abril 2025