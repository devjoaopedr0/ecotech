# 🌿 EcoTech: painel web

Painel para monitorar e controlar a irrigação de uma horta. Sensores medem a umidade do solo de cada planta, e o painel mostra esses dados, avisa quando alguma planta precisa de atenção e permite ligar e desligar a irrigação, no modo automático ou no manual.

Feito com **React 19 + TypeScript + Vite**. Funciona de dois jeitos:

| Modo | Quando | De onde vêm os dados |
|---|---|---|
| **API** | `VITE_API_URL` definido no `.env` | Do [backend](../backend/README.md). Login real, dados persistidos, irrigação decidida pelo servidor |
| **Simulado** | Sem `VITE_API_URL` | De `src/utils/mockData.ts`. Qualquer login entra e a irrigação é simulada no navegador |

> 📜 O histórico de alterações, commit a commit, está em [CHANGELOG.md](CHANGELOG.md).

## Telas

| Tela | O que faz |
| --- | --- |
| **Login** | Entrada com e-mail e senha, e link para o cadastro |
| **Cadastro** | Criação de conta com nome, e-mail, usuário, senha e um questionário sobre o nível de conhecimento em tecnologia (envio ainda simulado, veja [Cadastro e questionário](#-cadastro-e-questionário)) |
| **Visão Geral** | Saúde da horta, umidade atual, alertas, recomendações, previsão do tempo e eficiência |
| **Dashboard** | Gráficos, consumo e economia de água, e relatório de irrigação em CSV |
| **Monitor** | Uma planta por vez: umidade, previsão, saúde, colheita e controles de irrigação (ligar/desligar, automático/manual, duração) |
| **Relatórios** | Consumo, economia, irrigações, umidade média, plantas críticas, alertas e sensores, com filtros Hoje, 7 dias, 30 dias e Personalizado. Inclui a coleta de dados com exportação em CSV |
| **Sensores** | Sensores de umidade, temperatura, luminosidade, nível da água, temperatura foliar e umidade do ar, com status e calibração |
| **Plantas** | Busca, edição dos limites de umidade e da data de plantio, culturas, fotos e exclusão |
| **Configurações** | Tema claro/escuro, perfil, troca de senha, notificações e logout |
| **Apple Watch** | Em telas de relógio, o app mostra só o login e o controle de irrigação |

## Tecnologias

- **Vite**: build e servidor de desenvolvimento
- **React 19** e **React Router**: interface e navegação
- **TypeScript**: tipagem estática
- **Recharts**: gráficos
- **CSS puro** com variáveis de tema, sem framework de UI, para manter fidelidade ao design de referência
- **oxlint**: lint

---

## ▶️ Como rodar

### 1. Pré-requisitos

**Node.js 20.19+ ou 22.12+** (exigência do Vite 8). Para conferir:

```bash
node -v
```

Se não tiver, instale a versão LTS em https://nodejs.org. O `npm` já vem junto.

### 2. Instalar as dependências

A partir da raiz do repositório:

```bash
cd app/frontend
npm install
```

### 3. Configurar o ambiente

```bash
cp .env.example .env
```

O `.env.example` já aponta para o backend local:

```
VITE_API_URL=http://localhost:3333
```

- **Com o backend:** suba o backend antes (veja o [README dele](../backend/README.md)) e crie uma conta em `POST /auth/register`, pelo Swagger em `http://localhost:3333/docs`. Depois entre no painel com esse e-mail e senha.
- **Sem backend:** apague a linha `VITE_API_URL` (ou deixe-a vazia). O app roda com os dados simulados e aceita qualquer e-mail e senha.

> ⚠️ O `.env` não vai para o Git (está no `.gitignore`). Não existe chave de API no front: tudo que vai no bundle é público, e a autenticação é por JWT.

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Abra http://localhost:5173. As alterações no código atualizam a tela na hora. Para parar, use `Ctrl + C`.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run build` | Checa os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` localmente para conferir o build |
| `npm run lint` | Roda o oxlint |

---

## 🔌 Modo API

`src/api/types.ts` define o contrato (`EcotechApi`) no vocabulário das telas. `src/api/index.ts` escolhe a implementação: `httpEcotechApi` quando `VITE_API_URL` existe, `mockEcotechApi` quando não.

No modo API o backend é a fonte da verdade:

- o `PlantsContext` carrega plantas, placas, culturas, ciclos de irrigação, consumo e leituras ao entrar e depois a cada 15 s;
- liga/desliga, modo, edição de planta e de cultura e calibração vão para a API e, em seguida, os dados são recarregados. Se a API recusar, a mudança otimista é desfeita;
- a irrigação automática é decidida pelo backend a cada leitura da placa, e não no navegador;
- o access token vence em 15 minutos e é renovado sozinho com o refresh token. Se o refresh falhar, o app volta para o login.

`src/api/mappers.ts` é o único lugar que conhece os dois formatos: DTOs do backend, em inglês, e modelos de `src/types`, em português.

### O que ainda é simulado no modo API

- Previsão do tempo (`climaInicial`)
- Gráfico de umidade do Monitor (`gerarHistoricoPlanta`; o backend já tem `GET /plants/:id/readings/history`)
- Fotos das plantas, que ficam só na memória do navegador
- "Registrar leitura agora", que só recarrega as últimas leituras recebidas

## 🧪 Modo simulado

Todos os dados vêm de `src/utils/mockData.ts` e o estado fica em memória (Context API). A irrigação é **simulada**: a cada ~1,5 s reais passa 1 minuto simulado e o solo ganha 2 pontos de umidade. A vazão simulada é de 2 L/min, e a economia é estimada em relação a uma irrigação convencional de horário fixo.

---

## 💧 Regras de umidade e irrigação

As mesmas regras rodam no backend (`app/backend/src/domain`) e, no modo simulado, aqui (`src/utils`).

- **Limites por planta** (*Plantas → Editar planta*): crítica, mínima, faixa ideal e máxima.
- **Status** (`src/utils/umidade.ts`): **Crítico** abaixo da crítica, **Atenção** abaixo da mínima ou acima da máxima, **Normal** no resto.
- **Automático:** liga ao detectar umidade crítica e para ao voltar à faixa ideal (ou em 20 minutos). Se o usuário desligar com o solo ainda crítico, o automático não religa até a umidade se recuperar.
- **Manual:** liga por um tempo escolhido ou até ser desligado, e para se passar da máxima. O sistema só recomenda irrigar.
- **Histórico:** cada irrigação registra data, duração, tipo, motivo, litros e a umidade antes e depois.
- **Alertas** (`src/utils/alertas.ts`): umidade crítica, baixa e alta, sensor offline, reservatório baixo (< 20%), temperatura elevada (> 32 °C), estresse hídrico e irrigação iniciada/concluída. Aparecem na Visão Geral, no Monitor e no sino do Header.

## 🤖 Inteligência da horta

Regras em funções puras, em `src/utils/analise.ts`:

| Funcionalidade | Onde aparece | Regra resumida |
|---|---|---|
| Previsão do tempo | Visão Geral | Temperatura, condição, máx./mín., probabilidade e horário da chuva (simulado) |
| Recomendações | Visão Geral | Irrigar plantas em modo manual que ficarão críticas em ≤ 3 h; adiar quando a chuva (≥ 60%) chega antes de a planta ficar crítica |
| Previsão de umidade | Monitor | Queda por hora (ajustada pela temperatura) para agora, 1 h, 2 h e 3 h, e aviso de quando atinge o nível crítico |
| Saúde da planta (0–100) | Monitor | Umidade 50%, temperatura 20%, luminosidade 15% e frequência de irrigação 15%. Saudável ≥ 80, Atenção 60–79, Crítico < 60 |
| Anomalias | Visão Geral e sino | Sensor com leitura parada há ≥ 12 h; consumo ≥ 25% acima da média; ≥ 4 irrigações em 6 h na mesma planta |
| Custo e economia | Dashboard e Relatórios | Litros × tarifa (R$ 6,48/m³ no simulado; no modo API, a tarifa vem do backend) |
| Eficiência | Visão Geral | Economia 25%, saúde 30%, sensores 15%, alertas 15% e uso inteligente da água 15% |
| Culturas | Plantas | Temperatura, luminosidade, irrigações por dia e ciclo, editáveis. Os limites de umidade continuam por planta |
| Colheita | Monitor | Data de plantio + ciclo da cultura |
| Histórico visual | Plantas | Fotos por planta ("Dia N" desde o plantio), reduzidas no navegador |

## 🧭 Roteiro IrrigaAI: o que já está coberto

| Etapa | No sistema | Falta |
|---|---|---|
| 1. Sensores e calibração | *Sensores → Calibrar*: placa Arduino (0–1023) ou ESP32 (0–4095), leitura bruta no ar (0%) e na água (100%), prévia ao vivo e validação. A calibração é gravada no backend (`PUT /devices/:id/calibration`) e a placa envia só o valor bruto | Medir seco/molhado de cada sensor real |
| 2. Manejo do solo | Faixas **Seco**, **Adequado** e **Excesso de água**, e umidade crítica por planta | Definir as faixas da cultura em campo |
| 3. Acionamento remoto | Ligar/desligar por planta pela API; o comando vai para a placa na resposta da próxima leitura | Firmware acionando a bomba |
| 4. Testes de irrigação | Cada irrigação registra a umidade antes e depois; o Monitor sugere o tempo de bomba pela resposta média medida | Resposta real do solo ao gotejamento |
| 5. Coleta de dados | *Relatórios → Dados coletados*: leituras brutas e em %, nas fases antes/durante/depois, e exportação em CSV com placa, profundidade e posição | Pedir uma leitura à placa sob demanda |
| 6. Cultura | Parâmetros por cultura, gravados no backend | Escolher a cultura de referência |
| 7. Planta e clima | Sensores de temperatura foliar e umidade do ar; alerta de estresse hídrico quando a folha fica ≥ 3 °C acima do ar | Previsão do tempo real e sensores instalados |
| 8. IA preditiva | Previsão de umidade e recomendações por faixas e tendência (`utils/analise.ts`) | Treinar modelos com dados reais |
| 9. Estrutura (case, solar, LoRa) | Fora do escopo do front | Protótipo físico e testes de alcance |

---

## 📁 Estrutura

```
src/
├── api/          # comunicação com o backend (ver abaixo)
├── routes/       # navegação (ver abaixo)
├── pages/        # Login, Cadastro, VisaoGeral, Dashboard, Monitor, Relatorios, Sensores, Plantas, Configuracoes, Watch
├── components/   # Button, Card, Modal, Table, Input, Sidebar, Header, AlertList, ícones…
├── layouts/      # MainLayout (Sidebar + conteúdo)
├── context/      # AuthContext, ThemeContext e PlantsContext (estado da horta)
├── hooks/        # useIsWatch
├── types/        # tipos do domínio
├── utils/        # regras (umidade, alertas, análise, calibração), formatação, CSV e dados simulados
└── styles/       # theme.css (tokens de cor) e common.css (classes compartilhadas)
```

```
src/api/
  types.ts              contrato `EcotechApi` (o que as telas podem pedir)
  dto.ts                formato das respostas do backend
  mappers.ts            DTO do backend ⇄ modelos das telas
  endpoints.ts          todas as URLs da API
  session.ts            tokens da sessão (sessionStorage) e aviso de sessão expirada
  client.ts             fetch com Bearer, refresh automático no 401, timeout e `ApiError`
  ecotechApi.http.ts    implementação real (REST)
  ecotechApi.mock.ts    implementação simulada
  index.ts              exporta `ecotechApi`: HTTP se VITE_API_URL existir, senão simulado

src/routes/
  paths.ts              caminhos das telas (`ROTAS`)
  routeConfig.ts        telas autenticadas (`ROTAS_PRIVADAS`)
  AppRoutes.tsx         monta as rotas (desktop e Apple Watch)
  ProtectedRoute.tsx    redireciona para /login sem sessão
```

### Como estender

- **Nova tela:** crie a página, adicione o caminho em `routes/paths.ts` e uma linha em `routes/routeConfig.ts` (e o item no Sidebar, se for aparecer no menu).
- **Novo endpoint:** declare em `api/endpoints.ts`, o tipo da resposta em `api/dto.ts`, o método em `api/types.ts`, a conversão em `api/mappers.ts`, e implemente em `ecotechApi.http.ts` e `ecotechApi.mock.ts`.
- `App.tsx` só monta os providers e o `AppRoutes`.

## 📝 Cadastro e questionário

Tela pública em `/cadastro`, acessível pelo link **Cadastre-se** no login. Não existe na versão do Apple Watch.

- **Campos:** nome completo, e-mail, usuário, senha e confirmar senha.
- **Questionário:** *"Qual é o seu nível de conhecimento em tecnologia?"*, com as opções **Muito**, **Médio** e **Pouco**, exibidas como cartões selecionáveis (radio buttons acessíveis por teclado).
- **Envio:** ainda simulado, nos dois modos. A tela não chama `POST /auth/register`: os dados não são salvos e o usuário volta ao login com a mensagem *"Cadastro realizado!"*. No modo API, por enquanto, a conta é criada pelo Swagger.

### Validação (estruturada, mas desativada)

Hoje **nada é validado**, mas toda a estrutura já existe em `src/pages/Cadastro/cadastroValidation.ts`:

| Item | Função |
| --- | --- |
| `OPCOES_CONHECIMENTO` | Opções do questionário (valor, título e descrição) |
| `regras` | Regras prontas e reutilizáveis: `obrigatorio`, `email`, `minCaracteres`, `igualA` e `umaDasOpcoes` |
| `regrasCadastro` | Lista de regras de cada campo (**hoje todas vazias**) |
| `validarCadastro(form)` | Executa as regras e retorna o primeiro erro de cada campo |
| `temErros(erros)` | Indica se algum campo tem erro |

A tela já chama `validarCadastro` no envio: se houver erros, o envio é bloqueado, a mensagem aparece abaixo do campo (prop `error` do componente `Input`) e a borda fica vermelha. O erro some quando o usuário edita o campo. Para ativar, basta preencher as listas (a senha segue a regra do backend, de 8 a 72 caracteres):

```ts
export const regrasCadastro: Record<CampoCadastro, Regra[]> = {
  nome: [regras.obrigatorio('Informe seu nome.')],
  email: [regras.obrigatorio(), regras.email()],
  usuario: [regras.obrigatorio()],
  senha: [regras.obrigatorio(), regras.minCaracteres(8)],
  confirmarSenha: [regras.igualA('senha', 'As senhas não conferem.')],
  nivelConhecimento: [regras.umaDasOpcoes(OPCOES_CONHECIMENTO.map((o) => o.valor))],
};
```

Uma regra nova é só uma função `(valor, form) => string | undefined` (a mensagem de erro, ou `undefined` se estiver ok).

**Arquivos envolvidos:** `src/pages/Cadastro/` (tela, CSS e validação), `src/types/index.ts` (`CadastroForm`, `NivelConhecimentoTecnologia`), `src/routes/paths.ts` (`ROTAS.cadastro`), `src/routes/AppRoutes.tsx` (rota pública), `src/components/Input/` (prop `error`) e `src/pages/Login/` (link e mensagem de sucesso).

## 🔜 Próximos passos

- Ligar o cadastro ao backend (`POST /auth/register`) e ativar as regras de validação. O backend ainda não guarda o usuário (login) nem o nível de conhecimento: entram só nome, e-mail e senha.
- Gráfico do Monitor com o histórico real (`GET /plants/:id/readings/history`).
- Mostrar no sino os alertas gravados pelo backend (`GET /alerts`) e marcá-los como lidos.
- Telas de cadastro de planta e de placa (hoje só pelo Swagger).
- Previsão do tempo, fotos e "Registrar leitura agora" dependem de recursos que o backend ainda não tem (veja "Ainda falta" no [README do backend](../backend/README.md#ainda-falta)).
