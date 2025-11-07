# Config

Arquivos de configuração da aplicação.

## Arquivos a serem criados/movidos:
- `firebase.config.js` - Configuração do Firebase (mover de firebase.js)
- `stripe.config.js` - Configuração do Stripe (mover de stripe.js)
- `module.config.js` - Configuração de módulos (extrair de moduleService.js)

## Exemplo de uso:
```jsx
import { firebaseConfig } from '@/config/firebase.config';
import { stripeConfig } from '@/config/stripe.config';
import { moduleConfig } from '@/config/module.config';
```
