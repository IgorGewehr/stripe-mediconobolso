# Features

Componentes organizados por feature/domínio (anteriormente organismsComponents).

## Estrutura:

### `/admin`
Componentes administrativos e gestão do sistema.

### `/auth`
Componentes de autenticação e autorização (Google Auth, etc.).

### `/dialogs`
Modais e dialogs da aplicação (15 componentes).

### `/forms`
Formulários complexos (auth forms, sign up, patient forms).

### `/mobile`
Componentes específicos para mobile.

### `/patients`
Gestão de pacientes (cards, listas, management).

### `/prescriptions`
Gestão de receitas médicas.

### `/viewers`
Visualizadores especializados (Anamnese, Exames, Receitas).

### `/shared`
Componentes compartilhados entre múltiplas features.

## Exemplo de uso:
```jsx
import { AdminDashboard } from '@/features/admin';
import { AnamneseDialog } from '@/features/dialogs';
import { CardPaciente } from '@/features/patients';
import { AnamneseViewer } from '@/features/viewers';
```
