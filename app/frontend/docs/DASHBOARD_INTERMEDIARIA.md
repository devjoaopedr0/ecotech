# Dashboard intermediária

Entrada: `/intermediario`. Telas: **Início**, **Plantas** (+ detalhe `/intermediario/plantas/:id`), **Irrigação**, **Alertas** e **Configurações**.
Mesmo layout, menu e componentes da avançada (`MainLayout`, `Sidebar`, `Card`, `AlertList`, `GraficoUmidade`). Regras compartilhadas: `compartilhado/utils/horta.ts`, `sensores.ts`, `alertas.ts`.
Regras próprias da intermediária (puras e testadas): `src/intermediario/regras/`. Dados derivados: `useIntermediario()`.

## O que cada tela faz
- **Início**: faixa de atualização (última leitura, fonte, aviso de desatualização, "Atualizar leituras") → resumo (plantas monitoradas x cadastradas, umidade, sensores, irrigação) → ações rápidas → Central de atenção + Recomendações → plantas (semáforo, busca, filtros) → gráfico principal → irrigação + atividades recentes.
- **Plantas**: lista completa; aceita `?filtro=atencao|alertas|sem_dados`.
- **Detalhe da planta**: estado, motivos, sensor, limites (somente consulta, com faixa visual), gráfico, irrigação e ocorrências da planta.
- **Irrigação**: estado geral e controle por planta (iniciar/parar) com validação, confirmação e retorno do comando.
- **Alertas**: toda a Central de atenção e as recomendações.

## Regras
- Semáforo (`regras/semaforo.ts`): Adequado / Atenção / Crítico / Sem dados recentes (ou Sem sensor). Usa os limites de cada planta e a faixa de temperatura da cultura. Dado ausente, inválido, offline, travado ou desatualizado nunca é "Adequado".
- Central (`regras/central.ts`): alertas ativos sem repetição (tipo + planta), por prioridade e relevância, com valor observado, limite, horário (ou "condição ativa agora"), planta/dispositivo e ação. Falha de irrigação só quando o serviço recusou o comando. Consumo alto fica na avançada.
- Recomendações (`regras/recomendacoes.ts`): determinísticas, sobre dados medidos (tendência por regressão linear com leituras suficientes, mudança ≥ 15 p.p., modo manual com solo seco, temperatura fora da faixa, planta sem sensor). Não usam IA nem a previsão do tempo (hoje simulada). O que já é alerta não se repete.
- Irrigação (`compartilhado/utils/irrigacao.ts`, também usada pela básica): bloqueia se já em andamento, comando em envio ou reservatório < 20%; avisa (sem bloquear) com solo acima do máximo, sem leitura confiável ou reservatório sem leitura. "Comando enviado" nunca é "irrigando confirmado".
- Atualização (`regras/atualizacao.ts`): desatualizado quando a última leitura passa de 3× o intervalo esperado (mesma tolerância dos sensores).
- Atividades (`regras/atividades.ts`): irrigações iniciadas/concluídas e mudanças de estado da umidade (leituras de rotina vs. limites atuais). Nada é inventado.

## Origem dos dados
O `PlantsContext` ainda lê de `utils/mockData.ts` (Header mostra "Dados simulados"; `utils/fonteDados.ts`). Ao ligar à API real, mude `FONTE_DADOS.tipo` para `'api'`.
`PlantsContext` agora expõe `comandosIrrigacao` (por planta: enviando / enviado / falhou) e `registrarLeituras` também atualiza o relógio do sistema.

## Dependências de backend / hardware (não implementadas)
| Necessário | Efeito hoje |
|---|---|
| Confirmação do equipamento no contrato `enviarComandoIrrigacao` | Fora da simulação o estado fica "aguardando confirmação do dispositivo" |
| Perfis/permissões de usuário | Só exige usuário autenticado |
| Persistência de limites (`PUT /plantas/:id/limites`) | Limites só para consulta na intermediária |
| Leitura de dados via API com estados de carregando/erro | Sem indicador "atualizando" nem retenção de dados após falha de rede (não há requisição) |
| Eventos de sensor (recuperação/queda) com horário | Não aparecem nas atividades |
| Horário de início dos alertas de estado; reconhecimento de alertas | "Condição ativa agora"; sem marcar como reconhecido |
| Previsão do tempo real | Recomendação de adiar irrigação por chuva removida da intermediária |
| Histórico por planta em 7/30 dias | Gráfico mostra a média da horta e avisa |
| Histórico de temperatura | Sem gráfico de temperatura |
