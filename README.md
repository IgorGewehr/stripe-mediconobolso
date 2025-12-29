# Medico no Bolso

Sistema de Gestao Medica Completo com IA Integrada. Frontend Next.js conectado ao backend Doctor Server (Rust).

## Visao Geral

O **Medico no Bolso** e uma plataforma completa de gestao medica que combina ferramentas essenciais para profissionais de saude com recursos avancados de inteligencia artificial. O frontend e construido com Next.js 16 e React 19, comunicando-se com um backend robusto em Rust (Doctor Server).

### Objetivo

Democratizar o acesso a ferramentas de gestao medica profissionais, oferecendo uma solucao robusta, segura e intuitiva para clinicas e consultorios de todos os tamanhos.

---

## Arquitetura

```
+------------------------------------------------------------------+
|                      Frontend (Next.js)                           |
|               stripe-mediconobolso                                |
+------------------------------------------------------------------+
         |                    |                      |
         v                    v                      v
   Firebase Auth        REST API              WebSocket
         |                    |                      |
         +--------------------+----------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Backend (Rust)                                 |
|                   doctor-server                                   |
|    PostgreSQL + Redis + OpenAI + WhatsApp + Push                  |
+------------------------------------------------------------------+
```

### Fluxo de Comunicacao

1. **Autenticacao**: Firebase Auth gerencia login/registro
2. **API REST**: Todas as operacoes CRUD via `doctor-server`
3. **WebSocket**: Notificacoes em tempo real
4. **Firebase Storage**: Armazenamento de arquivos (legado)

---

## Stack Tecnologico

### Frontend

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| Next.js | 16.x | Framework React com App Router |
| React | 19.x | Biblioteca UI |
| Material-UI | 6.x | Componentes UI |
| TanStack Query | 5.x | Gerenciamento de estado servidor |
| Framer Motion | 12.x | Animacoes |
| Tailwind CSS | 3.x | Estilizacao |

### Servicos

| Servico | Proposito |
|---------|-----------|
| Firebase Auth | Autenticacao |
| Firebase Storage | Armazenamento de arquivos |
| Stripe | Pagamentos e assinaturas |
| Doctor Server | Backend API (Rust) |

---

## Estrutura do Projeto

```
stripe-mediconobolso/
+-- app/                          # Next.js App Router
|   +-- api/                      # API Routes (Next.js)
|   |   +-- ai/                   # Proxy para IA
|   |   +-- glossas/              # Proxy para glossas
|   |   +-- tiss/                 # Proxy para TISS
|   |   +-- webhooks/             # Stripe webhooks
|   |   +-- create-subscription/  # Assinaturas
|   |   +-- whatsapp/             # WhatsApp
|   |   +-- ...
|   +-- components/               # Componentes React
|   |   +-- ui/                   # Componentes base
|   |   +-- features/             # Componentes por dominio
|   |   +-- hooks/                # Custom hooks
|   |   +-- layout/               # Layout (Sidebar, TopBar)
|   |   +-- templates/            # Templates de pagina
|   |   +-- providers/            # Context providers
|   +-- app/                      # Paginas da aplicacao
|   +-- layout.jsx                # Layout raiz
|   +-- page.jsx                  # Pagina inicial
|
+-- lib/                          # Servicos e utilitarios
|   +-- config/                   # Configuracoes
|   |   +-- firebase.config.js    # Firebase
|   +-- services/                 # Camada de servicos
|   |   +-- api/                  # Servicos que chamam doctor-server
|   |   |   +-- apiService.js     # Cliente HTTP base
|   |   |   +-- config.js         # Configuracao da API
|   |   |   +-- patients.service.js
|   |   |   +-- appointments.service.js
|   |   |   +-- prescriptions.service.js
|   |   |   +-- financial.service.js
|   |   |   +-- nfse.service.js
|   |   |   +-- notifications.service.js
|   |   |   +-- websocket.service.js
|   |   |   +-- presence.service.js
|   |   |   +-- ...
|   |   +-- firebase/             # Servicos Firebase (legado/parcial)
|   |   +-- glossas.service.js    # Glossas
|   |   +-- tiss.service.js       # TISS
|   +-- hooks/                    # Hooks globais
|   +-- models/                   # Modelos de dados
|   +-- utils/                    # Utilitarios
|   +-- presenceService.js        # Presenca online
|   +-- firebaseService.js        # Firebase legado
|
+-- public/                       # Assets estaticos
+-- styles/                       # Estilos globais
+-- package.json
+-- next.config.js
+-- tailwind.config.js
```

---

## Funcionalidades

### Gestao de Pacientes
- Cadastro completo com historico medico
- Acompanhamento longitudinal de cuidados
- Controle rigoroso de privacidade (LGPD)
- Interface responsiva para acesso movel

### Sistema de Receitas
- Criacao digital de receitas medicas
- Templates personalizaveis
- Geracao de PDF profissional
- Envio automatico por email

### Agenda Inteligente
- Agendamento online e presencial
- Notificacoes automaticas (push, email, WhatsApp)
- Sincronizacao em tempo real via WebSocket
- Metricas de ocupacao

### IA Medica Avancada
- Analise automatica de exames (Vision)
- Geracao de resumos clinicos
- Chat medico em tempo real
- Transcricao de audio (Whisper)
- Analise de glossas com IA

### Faturamento TISS/TUSS
- Geracao de guias TISS
- Gestao de glossas e recursos
- Relatorios de producao

### Nota Fiscal Eletronica
- Emissao de NFSe via backend
- Consulta de status
- Cancelamento

### Notificacoes em Tempo Real
- WebSocket para atualizacoes instantaneas
- Push notifications (Web Push)
- Indicador de presenca online

### Gestao de Assinaturas
- Integracao completa com Stripe
- Suporte a cartao e boleto
- Multiplos planos (Mensal, Trimestral, Anual)
- Webhooks para sincronizacao

---

## Instalacao

### Pre-requisitos

- Node.js 18+
- npm ou yarn
- Conta Firebase
- Conta Stripe
- Doctor Server rodando (backend Rust)

### Passos

1. **Clone o repositorio**
```bash
git clone https://github.com/seu-usuario/stripe-mediconobolso.git
cd stripe-mediconobolso
```

2. **Instale as dependencias**
```bash
npm install
```

3. **Configure as variaveis de ambiente**
```bash
cp .env.example .env.local
```

4. **Inicie o desenvolvimento**
```bash
npm run dev
```

---

## Configuracao

### Variaveis de Ambiente

```env
# API Backend (Doctor Server)
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_USE_NEW_API=true

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI (para API routes que fazem proxy)
OPENAI_API_KEY=sk-your_openai_api_key
```

### Configuracao da API

O arquivo `lib/services/api/config.js` controla a comunicacao com o backend:

```javascript
// Flag para usar a nova API (doctor-server)
const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';

// URLs por ambiente
const API_URLS = {
  development: 'http://localhost:8080/api/v1',
  staging: 'https://staging-api.mediconobolso.com.br/api/v1',
  production: 'https://api.mediconobolso.com.br/api/v1',
};
```

---

## Servicos de API

### Estrutura de Servicos

Todos os servicos em `lib/services/api/` seguem o padrao:

```javascript
// patients.service.js
import apiService from './apiService';

export const patientsService = {
  async list(params) {
    return apiService.get('/patients', params);
  },

  async getById(id) {
    return apiService.get(`/patients/${id}`);
  },

  async create(data) {
    return apiService.post('/patients', data);
  },

  async update(id, data) {
    return apiService.put(`/patients/${id}`, data);
  },

  async delete(id) {
    return apiService.delete(`/patients/${id}`);
  },
};
```

### Servicos Disponiveis

| Servico | Arquivo | Descricao |
|---------|---------|-----------|
| API Base | `apiService.js` | Cliente HTTP com retry e rate limiting |
| Pacientes | `patients.service.js` | CRUD de pacientes |
| Agendamentos | `appointments.service.js` | Gestao de agenda |
| Prescricoes | `prescriptions.service.js` | Receitas medicas |
| Financeiro | `financial.service.js` | Gestao financeira |
| NFSe | `nfse.service.js` | Nota fiscal |
| Notificacoes | `notifications.service.js` | Push, email, etc |
| WebSocket | `websocket.service.js` | Tempo real |
| Presenca | `presence.service.js` | Status online |
| Clinica | `clinic.service.js` | Gestao de clinicas |
| Secretarias | `secretary.service.js` | Secretarias |
| Assinaturas | `subscriptions.service.js` | Stripe |
| Storage | `storage.service.js` | Upload de arquivos |
| IA | `ai-conversations.service.js` | Chat com IA |
| CRM | `crm.service.js` | Relacionamento |

---

## WebSocket

O servico de WebSocket (`websocket.service.js`) conecta ao backend para notificacoes em tempo real:

```javascript
import { websocketService } from '@/lib/services/api/websocket.service';

// Conectar
await websocketService.connect();

// Escutar eventos
websocketService.on('notification', (data) => {
  console.log('Nova notificacao:', data);
});

websocketService.on('appointment_update', (data) => {
  console.log('Agendamento atualizado:', data);
});

// Desconectar
websocketService.disconnect();
```

---

## Autenticacao

O fluxo de autenticacao usa Firebase Auth:

1. Usuario faz login via Firebase (email/senha, Google, etc)
2. Firebase retorna um ID Token
3. Frontend envia o token no header `Authorization: Bearer <token>`
4. Backend valida o token e extrai as claims

```javascript
// apiService.js
async getAuthToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuario nao autenticado');
  }
  return user.getIdToken();
}

async buildHeaders(customHeaders = {}) {
  const token = await this.getAuthToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...customHeaders,
  };
}
```

---

## Deploy

### Netlify (Recomendado)

```toml
# netlify.toml
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

---

## Comandos

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Producao
npm start

# Stripe webhooks (desenvolvimento)
stripe listen --forward-to localhost:3000/api/webhooks
```

---

## Seguranca

### Implementacoes

- Firebase Auth para autenticacao
- Tokens validados no backend
- Rate limiting com exponential backoff
- Webhooks Stripe assinados
- Sanitizacao de inputs
- Compliance LGPD

### Boas Praticas

- Nunca expor chaves secretas no frontend
- Validar todas as entradas do usuario
- Usar HTTPS em producao
- Rotacao regular de tokens

---

## Migracao Firebase -> Doctor Server

O projeto esta em processo de migracao do Firebase para o Doctor Server:

1. **Servicos em `lib/services/api/`** - Usam o novo backend
2. **Servicos em `lib/services/firebase/`** - Legado, sendo migrados
3. **`lib/firebaseService.js`** - Facade legado, delega para novos servicos

Para novos desenvolvimentos, sempre usar os servicos em `lib/services/api/`.

---

## Licenca

Proprietario - Todos os direitos reservados.

---

## Suporte

- **Email:** suporte@mediconobolso.com.br
- **Documentacao:** https://docs.mediconobolso.com.br
