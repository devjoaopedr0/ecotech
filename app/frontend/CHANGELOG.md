# 📜 Histórico de alterações

Registro do que foi feito no projeto, com base nos commits enviados ao GitHub (`origin/main`).

**Período coberto:** 05/10/2026 a 16/10/2026.

| Data | Commit | Autor | Mensagem |
| --- | --- | --- | --- |
| 15/10/2026 | `33117b6` | Marcos | Atualizado funcionalidades, estrutura e funcionalidades do sistema Ecotech |
| 16/10/2026 | `193a910` | guilhermeluis00 | Primeiro protótipo da tela de login *(na prática, contém a tela de **cadastro**)* |

> O último commit anterior ao período é o `20208cb` (03/10/2026, responsividade para mobile e relógios inteligentes).

---

## 16/10/2026 — Tela de cadastro (`193a910`)

**11 arquivos · +352 / −4 linhas**

### Nova tela `/cadastro`
- Campos de nome completo, e-mail, usuário, senha e confirmar senha, com mostrar/ocultar senha.
- Questionário *"Qual é o seu nível de conhecimento em tecnologia?"* com as opções **Muito**, **Médio** e **Pouco**, exibidas como cartões selecionáveis.
- Envio simulado: após o loading do botão "Cadastrar", volta ao login com a mensagem *"Cadastro realizado!"*.
- Mesmo visual do login (fundo, cores e botão com gradiente) e adaptação para telas pequenas.

### Estrutura de validação (desativada)
- `src/pages/Cadastro/cadastroValidation.ts` com regras reutilizáveis (`obrigatorio`, `email`, `minCaracteres`, `igualA`, `umaDasOpcoes`), a lista de regras de cada campo (`regrasCadastro`, hoje vazia) e as funções `validarCadastro` e `temErros`.
- A tela já chama a validação no envio e mostra os erros abaixo de cada campo. Para ativar, basta preencher `regrasCadastro`.

### Outras mudanças
- **`Input`**: nova prop opcional `error`, que mostra a mensagem abaixo do campo e deixa a borda vermelha.
- **Login**: link "Não tem uma conta? Cadastre-se" e mensagem de sucesso após o cadastro (escondidos no Apple Watch).
- **Rotas**: `ROTAS.cadastro` em `routes/paths.ts` e rota pública em `routes/AppRoutes.tsx`. Não existe na versão do relógio.
- **Tipos**: `CadastroForm` e `NivelConhecimentoTecnologia` em `src/types/index.ts`.

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

### Regras de negócio (`src/utils/`)
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
