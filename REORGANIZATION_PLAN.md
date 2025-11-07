# 📋 Plano de Reorganização do Projeto - Médico no Bolso

> **Status**: ✅ Fase 1 Concluída | 🔄 Estrutura Criada | ⏳ Aguardando Migração Gradual

---

## 🎯 Objetivo

Reorganizar o projeto de sistema de gestão médica para estrutura profissional, mantendo funcionalidade e facilitando manutenção futura.

---

## ✅ Melhorias Já Implementadas (Fase 1)

### 1. **Arquivos da Raiz Movidos**
- ✅ `usersquare.png` (4.7 MB) → `public/images/usersquare.png`
- ✅ `por.traineddata` (2.4 MB) → `public/ocr/por.traineddata`
- ✅ `maxLength` (arquivo vazio) → DELETADO

### 2. **Correção de Typos em Componentes**
- ✅ `anamneseViwer.jsx` → `anamneseViewer.jsx`
- ✅ `examViwer.jsx` → `examViewer.jsx`
- ✅ `receitasViwer.jsx` → `receitasViewer.jsx`
- ✅ Todos os imports atualizados (3 arquivos corrigidos)

### 3. **Nova Estrutura de Pastas Criada**

#### **app/components/**
```
app/components/
├── providers/           # Contexts e providers (AuthProvider, ThemeProvider)
├── hooks/               # Custom hooks (useModuleAccess, useScale)
├── layout/              # Componentes de layout (Sidebar, TopAppBar)
├── templates/           # Page templates (DashboardTemplate, PatientsListTemplate)
├── ui/                  # UI components básicos
│   ├── buttons/         # Botões reutilizáveis
│   ├── cards/           # Cards de dados
│   └── inputs/          # Campos de entrada
└── features/            # Feature-specific components
    ├── admin/           # Componentes administrativos
    ├── auth/            # Autenticação e autorização
    ├── dialogs/         # Modais e dialogs
    ├── forms/           # Formulários complexos
    ├── mobile/          # Componentes mobile-specific
    ├── patients/        # Gestão de pacientes
    ├── prescriptions/   # Gestão de receitas
    ├── viewers/         # Visualizadores (Anamnese, Exames, Receitas)
    └── shared/          # Componentes compartilhados entre features
```

#### **lib/**
```
lib/
├── config/              # Arquivos de configuração
│   ├── firebase.config.js
│   ├── stripe.config.js
│   └── module.config.js
├── services/            # Serviços de negócio
│   ├── firebase/        # Serviços Firebase separados por domínio
│   │   ├── auth.service.js
│   │   ├── patients.service.js
│   │   ├── appointments.service.js
│   │   ├── prescriptions.service.js
│   │   ├── exams.service.js
│   │   ├── notes.service.js
│   │   ├── reports.service.js
│   │   ├── admin.service.js
│   │   └── storage.service.js
│   ├── email.service.js
│   ├── module.service.js
│   ├── presence.service.js
│   └── facebook.service.js
├── models/              # Modelos de dados (modelObjects)
└── utils/               # Utilitários (globalCache)
```

#### **public/**
```
public/
├── icons/               # SVG icons (~45 arquivos)
├── images/              # PNG/JPG images
├── videos/              # welcome.mp4
├── workers/             # pdf.worker.js
└── ocr/                 # Tesseract training data
    └── por.traineddata
```

---

## 📊 Análise Detalhada do Projeto

### **Estatísticas Atuais**
- 📁 **Total de Arquivos**: 256 (excluindo node_modules, .git, .next)
- 🧩 **Componentes**: 100+ arquivos JSX
- 🖼️ **Assets Públicos**: 67 arquivos
- 🔌 **API Routes**: 17 endpoints
- 📚 **Serviços (lib/)**: 8 arquivos principais

### **Componentes por Categoria**

#### **Root Components** (26 arquivos em `/app/components/`)
- **Templates**: 11 arquivos
  - `authTemplate.jsx`, `dashboardTemplate.jsx`, `doctorAITemplate.jsx`
  - `pacienteTemplate.jsx`, `pacienteCadastroTemplate.jsx`
  - `patientsListTemplate.jsx`, `prescriptionListTemplate.jsx`
  - `receitasTemplate.jsx`, `userDataTemplate.jsx`
  - `userProfileTemplate.jsx`, `centralAjudaTemplate.jsx`

- **Providers**: 3 arquivos
  - `authProvider.jsx`, `themeProvider.jsx`, `ClientProviders.jsx`

- **Hooks**: 2 arquivos
  - `useModuleAccess.jsx`, `useScale.jsx`

- **Protection/Layout**: 7 arquivos
  - `ModuleProtection.jsx`, `ProtectedRoute.jsx`
  - `sidebar.jsx`, `topAppBar.jsx`, `bottomNavigation.jsx`
  - `helpCenter.jsx`

- **Other**: 3 arquivos
  - `checkout.jsx`, `customCheckout.jsx`, `globalCache.js`

#### **Basic Components** (17 arquivos em `/app/components/basicComponents/`)
```
✅ MOVER PARA /ui/
├── buttons/
│   ├── NovoPacienteButton.jsx
│   ├── NovaReceitaButton.jsx
│   ├── NovoAgendamentoButton.jsx
│   ├── CriarNovaFichaButton.jsx
│   ├── CriarNovaReceitaButton.jsx
│   └── ImportFichaButton.jsx
├── cards/
│   ├── AnamneseCard.jsx
│   ├── AnotacoesCard.jsx
│   ├── ExamesCard.jsx
│   ├── ReceitasCard.jsx
│   ├── ReceitasNotaCard.jsx
│   └── WeatherCard.jsx
└── inputs/
    ├── SearchBar.jsx
    ├── SearchField.jsx
    ├── PeriodSelector.jsx
    └── AuthImage.jsx
```

#### **Organism Components** (60 arquivos em `/app/components/organismsComponents/`)

**Dialogs** (15 arquivos) → `/features/dialogs/`
- `accessDeniedDialog.jsx` ⚠️ (consolidar com `AccessDeniedComponent.jsx`)
- `adminChatDialog.jsx`
- `allNotesDialog.jsx`
- `anamneseDialog.jsx`
- `audioProcessingDialog.jsx`
- `examDialog.jsx`
- `medicalChatDialog.jsx`
- `novaNotaDialog.jsx`
- `receitasDialog.jsx`
- `relatorioDialog.jsx`
- `secretaryManagerDialog.jsx`
- `subscriptionManagerDialog.jsx`
- `upgradeModal.jsx`
- `viewConsultationDialog.jsx`
- `viewNoteDialog.jsx`

**Admin** (4 arquivos) → `/features/admin/`
- `adminDashboard.jsx`
- `adminChatDialog.jsx`
- `adminMessagesComponent.jsx`
- `moduleAdminPanel.jsx`

**Mobile** (3 arquivos) → `/features/mobile/`
- `MobileConsultationCard.jsx`
- `MobilePatientsListCard.jsx`
- `mobileVideoPlayer.jsx`

**Auth** (3 arquivos) → `/features/auth/`
- `googleAuthButton.jsx`
- `googleAuthCompletion.jsx`
- `googleButton.jsx`

**Forms** (2 arquivos) → `/features/forms/`
- `authForms.jsx`
- `freeSignUpForm.jsx`
- `newPacienteForm.jsx`

**Viewers** (3 arquivos) → `/features/viewers/`
- ✅ `anamneseViewer.jsx` (renomeado de anamneseViwer)
- ✅ `examViewer.jsx` (renomeado de examViwer)
- ✅ `receitasViewer.jsx` (renomeado de receitasViwer)

**Patients** (3 arquivos) → `/features/patients/`
- `cardPaciente.jsx` ⚠️ (2,993 linhas - considerar divisão)
- `patientsList.jsx`
- `patientManagement.jsx`

**Shared/Others** (~27 arquivos) → `/features/shared/`
- `agendaComponente.jsx`
- `analytics.jsx`
- `browserImageProcessor.jsx`
- `comingSoon.jsx`
- `consultationCard.jsx`
- `eventoModal.jsx`
- `examTable.jsx`
- `floatingVoiceRecorder.jsx`
- `historicoConduta.jsx`
- `metricsCard.jsx`
- `miniChatCard.jsx`
- `notasSection.jsx`
- `notificationComponent.jsx`
- `planSelector.jsx`
- `realtimeMonitoring.jsx`
- `secretaryIndicator.jsx`
- `swipeableView.jsx`
- `unifiedUserManagement.jsx`
- `weatherContainer.jsx`
- e mais...

---

## 🚨 Problemas Críticos Identificados

### 1. **firebaseService.js Monolítico** ⚠️⚠️⚠️
- **Tamanho**: 4,271 linhas em um único arquivo
- **Problema**: Viola princípio de responsabilidade única
- **Impacto**: Difícil manutenção, debugging e testes
- **Solução**: Dividir em 9 serviços especializados

**Divisão Proposta**:
```javascript
// lib/services/firebase/auth.service.js
export const authService = {
  login, logout, register, resetPassword, etc.
}

// lib/services/firebase/patients.service.js
export const patientsService = {
  getPatient, createPatient, updatePatient, deletePatient,
  searchPatients, getPatientHistory, etc.
}

// lib/services/firebase/appointments.service.js
export const appointmentsService = {
  createAppointment, updateAppointment, deleteAppointment,
  getAppointments, rescheduleAppointment, etc.
}

// lib/services/firebase/prescriptions.service.js
export const prescriptionsService = {
  createPrescription, updatePrescription, getPrescriptions,
  generatePrescriptionPDF, etc.
}

// lib/services/firebase/exams.service.js
export const examsService = {
  createExam, updateExam, getExams, processExamOCR, etc.
}

// lib/services/firebase/notes.service.js
export const notesService = {
  createNote, updateNote, deleteNote, getNotes, etc.
}

// lib/services/firebase/reports.service.js
export const reportsService = {
  generateReport, getReports, exportReport, etc.
}

// lib/services/firebase/admin.service.js
export const adminService = {
  manageUsers, viewAnalytics, systemSettings, etc.
}

// lib/services/firebase/storage.service.js
export const storageService = {
  uploadFile, downloadFile, deleteFile, getFileUrl, etc.
}
```

### 2. **Componentes Gigantes** ⚠️
Arquivos com mais de 2,000 linhas que devem ser divididos:

| Arquivo | Tamanho | Linhas | Ação Recomendada |
|---------|---------|--------|------------------|
| `receitasTemplate.jsx` | 168 KB | 3,314 | Dividir em subcomponentes |
| `patientsListTemplate.jsx` | 139 KB | 3,207 | Dividir em subcomponentes |
| `cardPaciente.jsx` | 127 KB | 2,993 | Dividir em seções lógicas |
| `customCheckout.jsx` | 108 KB | 2,190 | Separar lógica de pagamento |
| `prescriptionListTemplate.jsx` | 92 KB | 2,147 | Dividir em subcomponentes |

### 3. **Componentes Duplicados** ⚠️
- `AccessDeniedComponent.jsx` vs `accessDeniedDialog.jsx`
  - **Solução**: Manter `accessDeniedDialog.jsx` (mais usado - 5 ocorrências)
  - **Migrar**: `ProtectedRoute.jsx` para usar `accessDeniedDialog`
  - **Deletar**: `AccessDeniedComponent.jsx`

### 4. **Pasta `/app/app/`** ⚠️
- **Problema**: Pasta aninhada confusa
- **Conteúdo**: `layout.jsx`, `page.jsx`, `loading.jsx`
- **Solução**: Parece ser rota protegida, renomear para `/app/(protected)/dashboard/`

---

## 🛠️ Plano de Migração Gradual

### **Fase 1: Preparação** ✅ CONCLUÍDA
- [x] Analisar estrutura completa
- [x] Identificar problemas organizacionais
- [x] Mover arquivos da raiz
- [x] Corrigir typos em nomes
- [x] Criar nova estrutura de pastas

### **Fase 2: Configuração de Aliases**
```json
// jsconfig.json ou tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["./app/components/*"],
      "@/ui/*": ["./app/components/ui/*"],
      "@/features/*": ["./app/components/features/*"],
      "@/lib/*": ["./lib/*"],
      "@/services/*": ["./lib/services/*"],
      "@/config/*": ["./lib/config/*"],
      "@/public/*": ["./public/*"]
    }
  }
}
```

**Benefícios**:
- Imports mais limpos: `import { Button } from '@/ui/buttons'`
- Facilita refatoração futura
- Suporta migração gradual (ambos caminhos funcionam)

### **Fase 3: Migração de UI Components** (Prioridade Alta)
**Impacto**: Baixo (poucos arquivos, imports simples)

**Passos**:
1. Mover arquivos de `basicComponents/` para `ui/`
2. Atualizar imports em arquivos que usam esses componentes
3. Criar `index.js` em cada subpasta para barrel exports

**Exemplo de Migration Script**:
```bash
# Mover buttons
mv app/components/basicComponents/novoPacienteButton.jsx app/components/ui/buttons/NovoPacienteButton.jsx
mv app/components/basicComponents/novaReceitaButton.jsx app/components/ui/buttons/NovaReceitaButton.jsx
# ... etc

# Criar barrel export
cat > app/components/ui/buttons/index.js << 'EOF'
export { default as NovoPacienteButton } from './NovoPacienteButton';
export { default as NovaReceitaButton } from './NovaReceitaButton';
export { default as NovoAgendamentoButton } from './NovoAgendamentoButton';
// ... etc
EOF
```

### **Fase 4: Migração de Features** (Prioridade Média)
**Impacto**: Médio (muitos arquivos, mas bem separados)

**Ordem de migração**:
1. **Viewers** (3 arquivos, baixo acoplamento)
2. **Mobile** (3 arquivos, isolados)
3. **Auth** (3 arquivos, relacionados)
4. **Dialogs** (15 arquivos, maior atenção)
5. **Forms** (3 arquivos)
6. **Admin** (4 arquivos)
7. **Patients** (3 arquivos)
8. **Shared** (restante)

### **Fase 5: Migração de Templates e Providers** (Prioridade Alta)
**Impacto**: Alto (muitos imports dependem deles)

**Ordem**:
1. **Providers** → `/app/components/providers/`
2. **Hooks** → `/app/components/hooks/`
3. **Layout** → `/app/components/layout/`
4. **Templates** → `/app/components/templates/`

### **Fase 6: Divisão do firebaseService.js** (Prioridade Crítica)
**Impacto**: Muito Alto (arquivo central do projeto)

**Estratégia**:
1. Criar arquivos de serviço separados
2. Manter `firebaseService.js` como agregador (backward compatibility)
3. Migrar imports gradualmente
4. Deprecar `firebaseService.js` quando todos migrarem

**firebaseService.js transitório**:
```javascript
// Mantém compatibilidade durante migração
export * from './services/firebase/auth.service';
export * from './services/firebase/patients.service';
export * from './services/firebase/appointments.service';
// ... etc

// Exporta como default para manter imports antigos funcionando
const FirebaseService = {
  ...authService,
  ...patientsService,
  ...appointmentsService,
  // ... etc
};

export default FirebaseService;
```

### **Fase 7: Organização de Assets** (Prioridade Baixa)
**Impacto**: Muito Baixo (apenas arquivos públicos)

**Passos**:
```bash
# Icons
mv public/*.svg public/icons/

# Images
mv public/*.png public/images/
mv public/*.jpg public/images/

# Videos
mv public/*.mp4 public/videos/

# Workers
mv public/pdf.worker.js public/workers/
```

### **Fase 8: Limpeza Final**
- Deletar pastas vazias
- Remover arquivos duplicados
- Atualizar documentação
- Code review completo

---

## 📁 Estrutura Final Desejada

```
stripe-mediconobolso/
├── app/
│   ├── (auth)/                    # Rotas públicas de autenticação
│   │   ├── auth/
│   │   ├── login/
│   │   └── free/
│   │
│   ├── (protected)/               # Rotas protegidas
│   │   ├── dashboard/             # Ex /app/app/
│   │   ├── patients/
│   │   ├── prescriptions/
│   │   └── appointments/
│   │
│   ├── api/                       # API routes (manter)
│   ├── actions/                   # Server actions (manter)
│   │
│   ├── components/
│   │   ├── providers/             # ✅ NOVO
│   │   ├── hooks/                 # ✅ NOVO
│   │   ├── layout/                # ✅ NOVO
│   │   ├── templates/             # ✅ NOVO
│   │   ├── ui/                    # ✅ NOVO (era basicComponents)
│   │   └── features/              # ✅ NOVO (era organismsComponents)
│   │
│   ├── styles/                    # Consolidado
│   ├── layout.jsx
│   ├── loading.jsx
│   └── page.jsx
│
├── lib/
│   ├── config/                    # ✅ NOVO
│   ├── services/                  # ✅ NOVO
│   ├── models/                    # ✅ NOVO
│   └── utils/                     # ✅ NOVO
│
├── public/
│   ├── icons/                     # ✅ NOVO
│   ├── images/                    # ✅ NOVO (inclui usersquare.png)
│   ├── videos/                    # ✅ NOVO
│   ├── workers/                   # ✅ NOVO
│   └── ocr/                       # ✅ NOVO (inclui por.traineddata)
│
├── CLAUDE.md
├── README.md
├── REORGANIZATION_PLAN.md         # ✅ ESTE ARQUIVO
├── netlify.toml
├── next.config.js
├── package.json
├── package-lock.json
└── tsconfig.json
```

---

## 🎯 Benefícios da Reorganização

### **Manutenibilidade**
- ✅ Componentes organizados por domínio/feature
- ✅ Fácil localizar arquivos relacionados
- ✅ Estrutura previsível para novos desenvolvedores

### **Escalabilidade**
- ✅ Fácil adicionar novos módulos
- ✅ Serviços separados facilitam testes
- ✅ Componentes menores e focados

### **Profissionalismo**
- ✅ Estrutura alinhada com best practices Next.js 15
- ✅ Adequado para portfolio no GitHub
- ✅ Facilita onboarding de novos desenvolvedores

### **Performance**
- ✅ Tree-shaking mais eficiente
- ✅ Code splitting otimizado
- ✅ Imports mais granulares

---

## 📋 Checklist de Migração

### **Antes de Começar**
- [ ] Fazer backup completo do projeto
- [ ] Criar branch de desenvolvimento: `git checkout -b refactor/reorganize-structure`
- [ ] Garantir que build atual funciona: `npm run build`
- [ ] Configurar path aliases no tsconfig.json

### **Durante Migração**
- [ ] Migrar categoria por categoria
- [ ] Testar build após cada migração
- [ ] Atualizar imports progressivamente
- [ ] Documentar mudanças no CHANGELOG.md

### **Após Migração**
- [ ] Executar `npm run build` e verificar sucesso
- [ ] Executar `npm run dev` e testar funcionalidades principais
- [ ] Code review completo
- [ ] Atualizar CLAUDE.md com nova estrutura
- [ ] Merge para main branch

---

## 🔧 Scripts Úteis

### **Encontrar todos imports de um arquivo**:
```bash
# Exemplo: encontrar quem importa authProvider
grep -r "authProvider" app/ --include="*.jsx" --include="*.js"
```

### **Listar componentes por tamanho**:
```bash
find app/components -name "*.jsx" -exec wc -l {} + | sort -rn | head -20
```

### **Verificar imports quebrados após mudança**:
```bash
npm run build 2>&1 | grep "Module not found"
```

---

## 🚀 Próximos Passos Recomendados

1. **Configurar Path Aliases** (30 min)
2. **Migrar UI Components** (2-3 horas)
3. **Migrar Feature Components** (1 dia)
4. **Dividir firebaseService.js** (2-3 dias)
5. **Migrar Templates e Providers** (1 dia)
6. **Organizar Public Assets** (1 hora)
7. **Testes e Validação** (1 dia)

**Estimativa Total**: 5-7 dias de trabalho focado

---

## 📞 Suporte

Para dúvidas ou problemas durante a migração:
1. Consultar este documento
2. Verificar CLAUDE.md para contexto do projeto
3. Testar build após cada mudança
4. Usar git para reverter se necessário

---

**Última Atualização**: 2025-11-07
**Versão do Documento**: 1.0
**Status**: ✅ Fase 1 Concluída | 🔄 Aguardando Fases 2-8
