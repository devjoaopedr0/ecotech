# Dashboard básica

Entrada: `/basico`. Telas: **Início**, **Minhas plantas** (`/basico/plantas`) e **Configurações** (`/basico/configuracoes`).
Para quem respondeu **Pouco** no cadastro ("Qual é o seu nível de conhecimento em tecnologia?"). O nível pode ser trocado depois em Configurações → Nível do painel.
Mesmo layout, menu e componentes das outras (`MainLayout`, `Sidebar`, `Card`, `Header`, `Modal`, `Button`). Dados: `useHorta()` (os mesmos números das outras dashboards). Dados derivados: `useBasico()`.

## O que cada tela faz
- **Início**: uma frase sobre a horta ("Está tudo bem", "quase toda bem", "precisa de você agora") → **O que fazer agora** (lista curta, urgentes primeiro) → até 4 plantas, as que precisam de cuidado primeiro.
- **Minhas plantas**: todas as plantas, sem busca nem filtros.
- **Cartão da planta**: nome, estado em palavras, frase do que fazer, "Água na terra" (barra + %) e botão **Regar** / **Parar de regar**.

## Regras (`src/basico/regras/simples.ts`, puras e testadas)
- Estado da planta, a partir de `diagnosticarPlanta` (mesmos limites de cada planta):
  - **Está bem**: umidade dentro dos limites.
  - **Precisa de água**: abaixo do mínimo ("regue hoje") ou do limite crítico ("regue agora", urgente).
  - **Terra encharcada**: acima do máximo ("não regue por enquanto").
  - **Sem informação**: sem sensor, sensor sem comunicação, leitura inválida, travada ou desatualizada. Nunca vira "Está bem".
- O que fazer agora: rega, terra encharcada, sensor sem informação e reservatório (vazio = urgente; sem leitura = conferir). Planta que já está sendo regada não pede rega.
- A temperatura fora da faixa da cultura não aparece na básica (fica na intermediária e na avançada).

## Regar
- Duração fixa de 5 minutos, sempre com confirmação; pode ser parada a qualquer momento.
- Usa a mesma validação da intermediária (`compartilhado/utils/irrigacao.ts`): bloqueia com rega em andamento, pedido ainda em envio ou reservatório abaixo de 20%; mostra os avisos antes de confirmar.
- Fora da simulação, "pedido enviado" não é mostrado como "regando" enquanto o equipamento não confirmar (mesma dependência de backend da intermediária).
