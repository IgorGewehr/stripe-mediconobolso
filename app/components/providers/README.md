# Providers

Contextos React e providers da aplicação.

## Arquivos a serem migrados:
- `authProvider.jsx` - Context de autenticação
- `themeProvider.jsx` - Context de tema
- `ClientProviders.jsx` - Provider wrapper do lado do cliente

## Exemplo de uso:
```jsx
import { AuthProvider } from '@/providers/authProvider';
// ou
import { AuthProvider } from '@/components/providers';
```
