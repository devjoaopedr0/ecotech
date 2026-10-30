# 📜 Histórico de alterações

Registro do que foi feito no projeto, com base nos commits enviados ao GitHub (`origin/main`).

**Período coberto:** 05/10/2026 a 16/10/2026.

| Data | Commit | Autor | Mensagem |
| --- | --- | --- | --- |
| 15/10/2026 | `33117b6` | Marcos | Atualizado funcionalidades, estrutura e funcionalidades do sistema Ecotech |
| 16/10/2026 | `193a910` | guilhermeluis00 | Primeiro protótipo da tela de login *(na prática, contém a tela de **cadastro**)* |

> O último commit anterior ao período é o `20208cb` (03/10/2026, responsividade para mobile e relógios inteligentes).

---

## 30/10/2026 — Migração para o monorepo e integração com a API

O frontend passou a viver em `app/frontend/` do repositório [devjoaopedr0/ecotech](https://github.com/devjoaopedr0/ecotech). A versão de lá ainda tinha a estrutura antiga (`src/pages`, `src/components`…), mas trazia a integração com o backend (commit `3dd43f3`, "conecta a camada de API ao backend"). Ela foi portada para a estrutura nova, com as três dashboards:

- **Camada de API** (`src/compartilhado/api/`): cliente com Bearer, refresh automático no 401 e timeout; sessão JWT (`session.ts`); DTOs e mappers entre o backend e as telas. `VITE_API_KEY` removido.
- **Login real** (`AuthContext`, `Login`): entrada por e-mail e senha. O nível da dashboard continua sendo aplicado no login e passa a ser guardado pelo **e-mail** (o cadastro também salva pelo e-mail).
- **PlantsContext em dois modos:** sem `VITE_API_URL`, a simulação de sempre; com ela, os dados vêm do backend (ao entrar e a cada 15 s) e as alterações vão para a API. Os comandos de irrigação manuais continuam registrando *enviando / enviado / falhou* (`comandosIrrigacao`), agora com as chamadas `iniciarIrrigacao` / `pararIrrigacao` da API.
- **Configurações:** troca de senha (mínimo de 8 caracteres, regra do backend) e notificações salvas pela API; o e-mail do perfil vem da sessão.
- **Tipos:** `Sensor.dispositivoId`; `LeituraColetada.bruto` pode ser `null` (Relatórios mostra "—").
- **Header / indicador de dados:** mostra "Conectado à API" quando `VITE_API_URL` está definido (antes era sempre "Dados simulados").
- **README** unificado: o do monorepo (modo API, modo simulado, como rodar) com os níveis de dashboard e a estrutura de pastas nova. O `CHANGELOG.md` antigo de `app/frontend/` foi substituído por este (`docs/CHANGELOG.md`), que já continha o mesmo histórico.

## 30/10/2026 — Dashboard básica (`e6864c2`)

- Novo nível `basico` (`NivelDashboard`): cadastro com resposta **Pouco** abre a básica (**Médio** → intermediária, **Muito** → avançada); pode ser trocado em Configurações (seletor com os três níveis).
- `src/basico/`: Início (situação da horta, o que fazer agora, plantas) e Minhas plantas, com botão de regar por planta (5 min, com confirmação).
- Regras em linguagem simples e testadas em `src/basico/regras/simples.ts`, derivadas do mesmo `useHorta`.
- Validação de irrigação movida de `src/intermediario/regras/irrigacao.ts` para `src/compartilhado/utils/irrigacao.ts` (usada pelas duas).
- `utils/nivel.ts`: `NIVEIS`, `DESCRICAO_NIVEL`, `ROTA_CONFIGURACOES` e tabela única de telas equivalentes entre os níveis; o Header usa o nível do usuário para achar as Configurações.
- Detalhes: `docs/DASHBOARD_BASICA.md`.

**Correções de bugs (revisão das três interfaces):**

- **Redirecionamento entre níveis** (`utils/nivel.ts`): o detalhe de uma planta da intermediária (`/intermediario/plantas/:id`) agora leva às Plantas do nível do usuário (antes caía no Início), e endereços com barra final (ex.: `/configuracoes/`) também acham a tela equivalente.
- **Tarefas da básica** (`basico/regras/simples.ts`): terra encharcada com a rega ainda ligada gera a tarefa urgente "Pare de regar …" (antes dizia só "Não regue … por enquanto").
- **Barra de umidade da básica** (`CartaoPlanta`): largura limitada entre 0% e 100%.
- Testes novos para os dois primeiros casos (73 testes no total).

## Evolução funcional da dashboard intermediária (não commitado)

- Início reorganizado: faixa de atualização dos dados, resumo (monitoradas x cadastradas), ações rápidas, Central de atenção, Recomendações, plantas com semáforo/busca/filtros, gráfico principal com planta e período, irrigação e atividades recentes.
- Novas telas: **Irrigação** (controle por planta com validação e confirmação) e **Detalhe da planta** (limites, gráfico, irrigação).
- Regras novas e testadas em `src/intermediario/regras/` (semáforo, central, recomendações, atividades, atualização, irrigação, filtros).
- `PlantsContext`: `comandosIrrigacao` (enviando/enviado/falhou) e `registrarLeituras` atualiza o relógio.
- Removido `EstadoSensores` (problemas de sensor agora estão na Central de atenção). Dashboard avançada sem alterações.
- Redirecionamento entre níveis: Monitor ↔ Irrigação.
- Detalhes e dependências: `docs/DASHBOARD_INTERMEDIARIA.md`.

---

## Diferenciação real das dashboards (não commitado)

**Causa:** o questionário do cadastro (`nivelConhecimento`) nunca era guardado nem usado, e o login sempre levava à avançada (`ROTAS.visaoGeral`); o usuário nunca chegava à intermediária. Além disso, a intermediária tinha um shell próprio (abas no topo, sem menu lateral), diferente da avançada.

- **Nível do usuário** (`utils/nivel.ts`, `AuthContext`): cadastro define o nível; login abre a dashboard correspondente; `RotaDoNivel` mantém cada nível nas suas telas; seletor em Configurações.
- **Intermediária** passa a usar `MainLayout` + `Sidebar` (menu com Início, Plantas, Alertas, Configurações) e o mesmo `Header`.
- **Início da intermediária** recomposto: situação, umidade e irrigação (`ResumoHorta nivel="intermediario"`), alertas prioritários (sem repetir os de sensor), 1 gráfico de 24 h, estado dos sensores (só o que exige atenção) e recomendações.
- **Configurações**: "Área técnica" só na avançada; layout da linha se ajusta.
- Testes novos em `utils/nivel.test.ts`.

---

## Padronização das dashboards (não commitado)

- Intermediária recomposta com os componentes e o CSS da avançada (cards, tabelas, filtros, alertas, gráficos, Sidebar sem rodapé próprio).
- Métricas compartilhadas em `useHorta` / `utils/horta.ts`; Visão Geral e Dashboard da avançada passam a usá-las (umidade média e contagem de saudáveis agora ignoram plantas sem leitura confiável).
- Gráfico de umidade único (`GraficoUmidade`) nas duas dashboards; o filtro de período do Dashboard passou a funcionar e as séries aleatórias/fixas do mock foram removidas.
- Header mostra "Dados simulados" nos dois níveis (antes a avançada dizia "Sistema conectado").
- CSS compartilhado movido de telas da avançada para `src/styles/dashboard.css`; removidas regras da intermediária que alteravam o Header global.

---

## 16/10/2026 — Tela de cadastro (`193a910`)

**11 arquivos · +352 / −4 linhas**

### Nova tela `/cadastro`
- Campos de nome completo, e-mail, usuário, senha e confirmar senha, com mostrar/ocultar senha.
- Questionário *"Qual é o seu nível de conhecimento em tecnologia?"* com as opções **Muito**, **Médio** e **Pouco**, exibidas como cartões selecionáveis.
- Envio simulado: após o loading do botão "Cadastrar", volta ao login com a mensagem *"Cadastro realizado!"*.
- Mesmo visual do login (fundo, cores e botão com gradiente) e adaptação para telas pequenas.

### Estrutura de validação (desativada)
- `src/compartilhado/pages/Cadastro/cadastroValidation.ts` com regras reutilizáveis (`obrigatorio`, `email`, `minCaracteres`, `igualA`, `umaDasOpcoes`), a lista de regras de cada campo (`regrasCadastro`, hoje vazia) e as funções `validarCadastro` e `temErros`.
- A tela já chama a validação no envio e mostra os erros abaixo de cada campo. Para ativar, basta preencher `regrasCadastro`.

### Outras mudanças
- **`Input`**: nova prop opcional `error`, que mostra a mensagem abaixo do campo e deixa a borda vermelha.
- **Login**: link "Não tem uma conta? Cadastre-se" e mensagem de sucesso após o cadastro (escondidos no Apple Watch).
- **Rotas**: `ROTAS.cadastro` em `routes/paths.ts` e rota pública em `routes/AppRoutes.tsx`. Não existe na versão do relógio.
- **Tipos**: `CadastroForm` e `NivelConhecimentoTecnologia` em `src/compartilhado/types/index.ts`.

---

## 15/10/2026 — Novas funcionalidades e reestruturação (`33117b6`)

**50 arquivos · +3.075 / −254 linhas**

### Novas telas
- **Sensores** (`/sensores`): lista de sensores (umidade, temperatura, luminosidade, nível da água, temperatura foliar e umidade do ar) com status online/offline, valor atual e localização.
  - **Calibração** (`CalibracaoModal`): placa Arduino (0–1023) ou ESP32 (0–4095), valores brutos seco/molhado, profundidade e posição do sensor, com prévia ao vivo.
- **Relatórios** (`/relatorios`): resumo do período, consumo de água, irrigações no período e dados coletados, com filtros Hoje, 7 dias, 30 dias e Personalizado. Permite registrar uma leitura na hora e exportar CSV.
- Ambas foram adicionadas ao menu lateral.

### Telas existentes ampliadas
- **Visão Geral**: previsão do tempo, recomendações de irrigação e índice de eficiência da Ecotech.
- **Monitor**: irrigação por planta (ligar/desligar, automático/manual, duração), alertas da planta, histórico de irrigação, previsão de umidade (agora, 1 h, 2 h e 3 h), saúde da planta (0–100), data da colheita e tempo de bomba sugerido.
- **Dashboard**: consumo de água, água economizada, custo estimado e histórico de consumo. O CSV do relatório ganhou as colunas de duração, tipo, motivo e litros.
- **Plantas**: limites de umidade por planta (crítica, mínima e máxima), data de plantio, parâmetros da cultura (`CulturaCard`) e fotos da planta por dia de cultivo (`FotosCard`).
- **Header**: o sino de notificações passou a mostrar os alertas reais do sistema, no lugar de uma lista fixa.
- **StatusBadge**: novo status **Crítico**; "Ideal" passou a se chamar **Normal**; aceita um rótulo personalizado.

### Regras de negócio (`src/compartilhado/utils/`)
- `umidade.ts`: classificação de status (Crítico, Atenção ou Normal) a partir dos limites de cada planta.
- `alertas.ts`: alertas de umidade crítica/baixa/alta, sensor offline, reservatório baixo, temperatura elevada e início/fim de irrigação.
- `analise.ts`: previsão de umidade, recomendações (inclusive adiar a irrigação se houver chuva prevista), saúde da planta, anomalias, custo, economia e eficiência.
- `calibracao.ts`: conversão do valor bruto do sensor para porcentagem.
- `csv.ts` e `format.ts`: exportação de CSV compatível com o Excel e formatação de datas, horas, durações e litros.
- `mockData.ts`: muito mais dados simulados (sensores, clima, culturas, consumo, histórico e leituras).

### Estado global
- `PlantsContext` passou a concentrar a simulação da irrigação, o histórico, o consumo, os sensores, os alertas, o clima, as culturas, as fotos e as leituras coletadas. Os comandos de irrigação são enviados à camada de API.

### Arquitetura
- **`src/api/`** (novo): contrato `EcotechApi` entre o front-end e o backend, endpoints centralizados, cliente HTTP (`VITE_API_URL` / `VITE_API_KEY`) e duas implementações, uma real (HTTP) e uma simulada (mock). Sem `VITE_API_URL`, o app usa a simulada.
- **`src/routes/`** (reorganizado): caminhos centralizados em `ROTAS` (`paths.ts`), tabela de telas autenticadas (`routeConfig.ts`) e `AppRoutes.tsx`. O `App.tsx` agora só monta os providers, e as telas e componentes usam `ROTAS` em vez de URLs fixas.
- **Componentes novos**: `AlertList` e ícones de termômetro, ondas, nuvem, chuva e câmera.
- **Tipos**: domínio ampliado (sensores, calibração, alertas, irrigação, consumo, clima, culturas, saúde, recomendações e leituras).
- `tsconfig.app.json`: apenas reformatação, sem mudança de configuração.

### Documentação
- README ganhou as seções *Umidade crítica, irrigação e economia de água*, *Inteligência da horta*, *Roteiro IrrigaAI* e *API e rotas separadas*.

---

## Ainda não commitado

- README: documentação da tela de cadastro, ajustes nas listas de telas e de pastas e remoção de uma linha `=======` que sobrou de um merge anterior.
- Este arquivo (`CHANGELOG.md`).

## Evolução das dashboards intermediária e avançada (não commitado)

**Intermediária mais enxuta** (Visão Geral: 8 blocos contra 13 da avançada)
- Visão Geral: indicadores (incluindo temperatura), um gráfico e "Alertas e recomendações" com a ação a tomar. Removidos: tabela de plantas em atenção, "plantas por estado" (duplicavam alertas e resumo), botão "Atualizar leituras" e o consumo de água (base simulada, não confiável).
- Monitoramento: removida a tabela "Últimas medições"; Dispositivos: 1 cartão em vez de 5 (os 4 totais repetiam o resumo).
- Páginas Gráficos e Histórico descontinuadas na intermediária (conteúdo duplicado ou de nível avançado). Os endereços antigos redirecionam (`ROTAS_INTER_REDIRECIONADAS`).

**Avançada com conteúdo adicional real**
- "Plantas: limites e tendência" (Visão Geral), "Comparação entre períodos" (Dashboard), "Diagnóstico de confiabilidade" (Sensores), alertas detalhados (indicador, valor, limite, ação).

**Regras compartilhadas**
- `utils/sensores.ts`: confiabilidade única (offline, travada, inválida, desatualizada pelo intervalo esperado). Estado da planta, alertas de umidade, indicadores e irrigação automática usam a mesma regra. Antes, uma leitura de sensor offline podia gerar alerta de umidade crítica.
- `Alerta` ganhou `indicador`, `valorAtual`, `limite` e `acao`; novos tipos `leitura_invalida` e `leitura_desatualizada`.
- Tendência medida por regressão linear, só conclui com dados suficientes; comparação de períodos exclui o dia incompleto.

**Correções**
- "Últimas leituras" usava horários inventados (`agora − i×5 min`); agora usa a última leitura registrada.
- Sensores/Dispositivos diziam "agora" para todo sensor online; agora mostram o horário real ou "não informado".
- Dois menus de período do Dashboard abriam juntos (estado compartilhado); ícone do "Status da horta" sempre verde; economia de água agora rotulada como estimada.

**Testes:** `npm test` (vitest, 24 testes das regras de confiabilidade, alertas, tendência e comparação).

### Intermediária com formato próprio (substitui o desenho anterior dela)
- Sem menu lateral: faixa de 4 abas no topo (Início, Plantas, Alertas, Configurações) e coluna única centralizada. Mesma identidade visual (cores, cartões, tipografia).
- Início: banner de situação, 3 números (umidade, temperatura, sensores), até 3 avisos com "O que fazer" e um gráfico de 24 h.
- Plantas: um cartão por planta (sem tabela, busca ou filtros). Alertas: só os que exigem ação.
- Removidas Monitoramento e Dispositivos (redirecionam para Plantas e Início). A avançada não foi alterada.
