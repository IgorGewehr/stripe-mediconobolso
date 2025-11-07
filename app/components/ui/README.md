# UI Components

Componentes de interface reutilizáveis (anteriormente basicComponents).

## Estrutura:
- `buttons/` - Botões especializados
- `cards/` - Cards de informação
- `inputs/` - Campos de entrada customizados

## Buttons
- NovoPacienteButton
- NovaReceitaButton
- NovoAgendamentoButton
- CriarNovaFichaButton
- CriarNovaReceitaButton
- ImportFichaButton

## Cards
- AnamneseCard
- AnotacoesCard
- ExamesCard
- ReceitasCard
- ReceitasNotaCard
- WeatherCard

## Inputs
- SearchBar
- SearchField
- PeriodSelector
- AuthImage

## Exemplo de uso:
```jsx
import { NovoPacienteButton } from '@/ui/buttons';
import { AnamneseCard } from '@/ui/cards';
import { SearchBar } from '@/ui/inputs';
```
