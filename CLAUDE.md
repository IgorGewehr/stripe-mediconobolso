# CLAUDE.md

Este arquivo fornece orientacoes para Claude Code ao trabalhar com codigo neste repositorio.

## Visao Geral do Projeto

Este e o frontend do sistema de gestao medica "Medico no Bolso", construido com Next.js 16 e React 19. O sistema se comunica com um backend Rust (Doctor Server) para todas as operacoes de dados, usando Firebase apenas para autenticacao e storage de arquivos.

### Arquitetura

```
Frontend (Next.js) <---> Doctor Server (Rust)
      |                        |
      v                        v
 Firebase Auth            PostgreSQL
 Firebase Storage         Redis
                          OpenAI
                          WhatsApp
```

## Comandos de Desenvolvimento

```bash
# Instalar dependencias
npm install

# Servidor de desenvolvimento
npm run dev

# Build para producao
npm run build

# Iniciar servidor de producao
npm start

# Stripe webhook testing (desenvolvimento)
stripe listen --forward-to localhost:3000/api/webhooks
```

## Estrutura do Projeto

### Diretorios Principais

```
/app                    # Next.js App Router
  /api                  # API Routes (proxies e webhooks)
  /components           # Componentes React organizados
    /ui                 # Componentes base reutilizaveis
    /features           # Componentes por dominio
    /hooks              # Custom hooks
    /layout             # Layout (Sidebar, TopBar)
    /templates          # Templates de pagina
    /providers          # Context providers
  /app                  # Paginas da aplicacao

/lib                    # Servicos e utilitarios
  /config               # Configuracoes (Firebase, etc)
  /services             # Camada de servicos
    /api                # Servicos que chamam doctor-server (PRINCIPAL)
    /firebase           # Servicos Firebase (legado)
  /hooks                # Hooks globais
  /models               # Modelos de dados
  /utils                # Utilitarios
```

### Camada de Servicos (IMPORTANTE)

Existem duas camadas de servicos:

1. **`lib/services/api/`** - **USAR ESTA** - Servicos que chamam o backend Rust
2. **`lib/services/firebase/`** - Legado, sendo migrados gradualmente

#### Servicos API (doctor-server)

| Arquivo | Descricao |
|---------|-----------|
| `apiService.js` | Cliente HTTP base com retry, rate limiting, auth |
| `config.js` | Configuracao de URLs e flags |
| `patients.service.js` | CRUD de pacientes |
| `appointments.service.js` | Gestao de agenda |
| `prescriptions.service.js` | Receitas medicas |
| `financial.service.js` | Gestao financeira |
| `nfse.service.js` | Nota fiscal eletronica |
| `notifications.service.js` | Notificacoes |
| `websocket.service.js` | Conexao WebSocket tempo real |
| `presence.service.js` | Status de presenca online |
| `clinic.service.js` | Gestao de clinicas |
| `secretary.service.js` | Secretarias |
| `subscriptions.service.js` | Assinaturas Stripe |
| `storage.service.js` | Upload de arquivos |
| `ai-conversations.service.js` | Chat com IA |
| `crm.service.js` | CRM |
| `admin.service.js` | Administracao |
| `conversations.service.js` | Conversas multicanal |
| `exams.service.js` | Exames |
| `notes.service.js` | Anotacoes |

### Autenticacao

O sistema usa Firebase Auth para autenticacao:

1. Usuario faz login via Firebase
2. Frontend obtem o Firebase ID Token
3. Token e enviado no header `Authorization: Bearer <token>`
4. Backend (doctor-server) valida o token

```javascript
// Em apiService.js
async getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario nao autenticado');
  return user.getIdToken();
}
```

### WebSocket

Notificacoes em tempo real via WebSocket:

```javascript
import { websocketService } from '@/lib/services/api/websocket.service';

// Conectar
await websocketService.connect();

// Eventos
websocketService.on('notification', handler);
websocketService.on('appointment_update', handler);
websocketService.on('presence_update', handler);
```

## Configuracao

### Variaveis de Ambiente

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_USE_NEW_API=true

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Stripe
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...

# OpenAI (para API routes)
OPENAI_API_KEY=...
```

### Next.js Configuration

- **Output**: Standalone build para deploy
- **Server Actions**: 10MB body size limit para uploads
- **Webpack**: External packages configurados para SSR

## Padroes de Desenvolvimento

### Componentes

- Usar estrutura modular em `/app/components`
- `ui/` para componentes base reutilizaveis
- `features/` para componentes de dominio especifico
- Path aliases configurados: `@/components`, `@/lib`, `@/services`
- Seguir padroes Material-UI
- Implementar loading states e error handling

### Servicos

Para novos desenvolvimentos, SEMPRE usar `lib/services/api/`:

```javascript
// CORRETO - Usar servicos API
import { patientsService } from '@/lib/services/api/patients.service';

const patients = await patientsService.list();

// EVITAR - Servicos Firebase legado
import { firebaseService } from '@/lib/firebaseService';
```

### API Routes

API Routes em `/app/api/` sao usadas para:
- Webhooks do Stripe
- Proxies para servicos que precisam de segredos server-side
- Operacoes que nao podem ser feitas client-side

### Tratamento de Erros

O `apiService.js` ja implementa:
- Retry automatico com exponential backoff
- Rate limiting handling (429)
- Mensagens de erro amigaveis

```javascript
try {
  const data = await apiService.get('/endpoint');
} catch (error) {
  // error.message ja e amigavel
  // error.status contem o HTTP status
  toast.error(error.message);
}
```

## Integracoes

### Doctor Server (Backend Rust)

- URL: `NEXT_PUBLIC_API_URL`
- Auth: Firebase ID Token no header
- WebSocket: `/api/v1/ws?token=<token>`

### Firebase

- Auth: Login, registro, reset de senha
- Storage: Upload de arquivos (legado, migrando para backend)

### Stripe

- Assinaturas e pagamentos
- Webhooks em `/api/webhooks`
- Boleto brasileiro suportado

## Dicas para o Assistente

1. **Sempre usar servicos em `lib/services/api/`** para novas funcionalidades
2. **Firebase Auth e mantido** - nao migrar autenticacao
3. **WebSocket para tempo real** - usar `websocket.service.js`
4. **Componentes em `features/`** - organizar por dominio
5. **Path aliases** - usar `@/lib`, `@/components`, etc
6. **TanStack Query** - para cache e estado de servidor
7. **Material-UI** - seguir padroes de tema
8. **Verificar `cargo check`** no backend antes de testar integracao
9. **Nao criar arquivos desnecessarios** - preferir editar existentes
10. **API Routes** - apenas para webhooks e proxies necessarios

## Deploy

### Netlify

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
```

### Vercel

```bash
npx vercel --prod
```
