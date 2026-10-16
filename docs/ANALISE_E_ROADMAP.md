# EcoTech — Análise do legado e roadmap do sistema novo

> Levantamento feito em 14/10/2026 a partir de:
> - **Legado:** [paivagpg77/ecotech-projeto](https://github.com/paivagpg77/ecotech-projeto) (Flask + HTML/CSS/JS)
> - **Front novo:** [Marcos023-Mv/ecotech-sistema-front](https://github.com/Marcos023-Mv/ecotech-sistema-front), copiado para [`app/frontend/`](../app/frontend/)
> - **Stack de referência:** LUMINA (`lumina-app` + `lumina-backend`)

## 1. O produto

O EcoTech monitora a **umidade do solo** de plantas com sensores (ESP32) e controla a **irrigação**. O usuário cadastra as plantas, cada uma com uma faixa ideal de umidade. O sistema mostra as leituras em tempo real, gera gráficos e relatórios, e avisa quando uma planta sai da faixa. A irrigação pode ser ligada manualmente ou rodar no modo automático.

## 2. Sistema legado (Python) — só como referência funcional

> **Decisão (15/10/2026):** o sistema novo terá um **banco novo**, modelado do zero. Do legado aproveitamos só **a ideia de como cada funcionalidade funciona**: nada de schema, código ou dados é migrado, e os usuários vão criar conta de novo.

### Stack
Flask + psycopg2 + PostgreSQL, com o front em HTML/CSS/JS puro servido pelo próprio Flask. Os gráficos são feitos em Canvas e os PDFs com jsPDF. A hospedagem é no Render.

### O que ele faz
| Área | Funcionalidade |
|---|---|
| Autenticação | Cadastro e login com usuário e senha; a sessão fica no `localStorage` |
| Catálogo | ~300 plantas do Nordeste (`plantas.py`), cada uma com nome e espécie e a faixa de umidade min/max; busca pt/en com autocomplete |
| Plantas do usuário | CRUD (nome, espécie, ícone, umidade mín/máx) |
| Sensor | O ESP32 faz `GET /receber?umidade=NN` a cada 10 s |
| Leituras | `GET /dados` (todas) e `GET /ultima` |
| Dashboard | Estatísticas (atual, média, máx, mín, amplitude, tendência), gráfico com a faixa ideal sobreposta, tabela com status Baixo/Ideal/Alto |
| Relatórios | PDF (no front com jsPDF e em `app_postgres.py` com reportlab) e CSV |
| Config | URL da API e intervalo de polling |

### Como cada funcionalidade funciona (o que levamos para o sistema novo)
1. **Conta:** a pessoa cria a conta e faz login. Cada usuário enxerga só as próprias plantas e sensores.
2. **Catálogo de plantas:** existe uma base de referência de plantas comuns no Nordeste, cada uma com nome popular, nome científico e faixa ideal de umidade do solo. A busca aceita digitação parcial, com no mínimo 2 letras, e procura tanto no nome popular quanto no científico.
3. **Cadastro de planta:** ao escolher uma planta do catálogo no autocomplete, o formulário já vem preenchido com o nome, a espécie e a faixa ideal. O usuário também pode preencher tudo à mão e escolher um ícone. A faixa precisa ter o mínimo menor que o máximo. Planta e sensor ficam vinculados.
4. **Leitura do sensor:** o ESP32 lê a umidade periodicamente (a cada 10 s no legado) e envia o percentual (0–100%) para a API, que guarda o valor com data e hora.
5. **Status da planta:** cada leitura é comparada com a faixa da planta. Abaixo do mínimo é **Baixo**, acima do máximo é **Alto**, e dentro da faixa é **Ideal**. O front novo acrescenta **Atenção**, para leituras nos 15% inferiores da faixa.
6. **Monitor:** o usuário escolhe uma planta e vê a umidade atual, um banner com o status, o gráfico com a faixa ideal desenhada por cima e a tabela de leituras. Os dados se atualizam sozinhos, com um intervalo configurável.
7. **Dashboard:** mostra as estatísticas do período: valor atual, média, máxima, mínima, amplitude (máx − mín) e tendência (se a umidade está subindo ou caindo).
8. **Relatórios:** exportam as leituras para PDF (cabeçalho, data de geração, total de registros e tabela) ou CSV.
9. **Irrigação** (novo, não existia no legado): pode ser ligada e desligada manualmente, ou ficar no modo automático, em que liga sozinha quando a umidade cai abaixo do mínimo e desliga quando volta à faixa.
10. **Alertas** (estavam planejados no legado): avisar no sistema e por e-mail quando uma planta sair da faixa.

### Endpoints (`main.py`)
```
POST /api/auth/register | POST /api/auth/login | GET /api/auth/usuario/<id>
GET|POST /api/usuarios/<id>/plantas | PUT|DELETE /api/usuarios/<id>/plantas/<planta_id>
GET /api/plantas/buscar?q= | GET /api/plantas/lista?page= | GET /api/plantas/total
GET /receber?umidade= | GET /dados | GET /ultima
```
O `app_postgres.py` é uma segunda versão, que nunca foi integrada ao `main.py`. Ela adiciona `POST /leitura`, `GET|POST /sensores`, `GET /exportar/pdf`, `GET /exportar/csv` e filtro por `sensor_id`.

### Problemas que **não** devem ser levados para o sistema novo
1. **Senhas em texto puro** no banco. Além disso, há **credenciais do banco fixas no código**, no `app_postgres.py` de um repositório público. O banco novo já resolve isso para o sistema novo, mas o banco antigo continua exposto enquanto existir e deve ser desativado ou ter a senha trocada.
2. **Não há autenticação real na API**: as rotas recebem `usuario_id` na URL, então qualquer pessoa consegue ler ou alterar as plantas de qualquer usuário.
3. **As leituras ficam num CSV local** (`umidade.csv`) no `main.py`, e esse arquivo se perde a cada deploy no Render. As leituras também não estão ligadas a sensor, planta nem usuário.
4. **Existem dois modelos de dados que não batem entre si**:
   - `data-base/db.sql`: UUID, com `usuarios`, `sensores`, `plantas` e `leituras`.
   - `tabelausuarios.py`: SERIAL, com `usuarios(username)` e `usuarios_plantas`. É o modelo que roda em produção.

   Nenhum dos dois será usado: o banco novo é modelado do zero (ver a seção 5.1).
5. **O sensor não se autentica**: qualquer pessoa consegue enviar leituras com `GET /receber`.
6. **Não existe controle de irrigação**: o sistema só lê o sensor e não aciona nada.

## 3. Front novo (`app/frontend`)

**Stack:** React 19, Vite 8, TypeScript 6, React Router 7, Recharts e CSS puro com tokens de tema. O build e o lint passam.

**Telas:** Login · Visão Geral · Dashboard · Monitor · Plantas · Configurações. Há também uma tela compacta para **Apple Watch**, com ligar/desligar e automático/manual.

**Estado atual: tudo é simulado.**
- A autenticação aceita qualquer usuário e senha e guarda a sessão no `sessionStorage` (`context/AuthContext.tsx`).
- As plantas, leituras, histórico e relatório vêm de `utils/mockData.ts` e ficam só em memória (`context/PlantsContext.tsx`).
- O estado da irrigação (ligada ou desligada, automático ou manual) só existe no front.
- A URL da API (`VITE_API_URL`) é lida, mas nenhuma chamada HTTP é feita.

**Funcionalidades do legado que ainda faltam no front novo:**
- [ ] Tela de **cadastro de conta** (hoje só existe a de login)
- [ ] **Cadastrar planta**: `adicionarPlanta` já existe no context, mas não há botão nem formulário
- [ ] **Autocomplete do catálogo** de plantas, que preenche a faixa ideal automaticamente
- [ ] Estatísticas de **amplitude e tendência** (média, mín e máx já existem)
- [ ] **Faixa ideal sobreposta** no gráfico
- [ ] Relatório em **PDF** (hoje só existe CSV)

## 4. Stack alvo (igual à LUMINA)

| Camada | LUMINA | EcoTech hoje | Decisão |
|---|---|---|---|
| Front | React 19 + Vite + TS + **Tailwind 4** + cva + lucide-react | React 19 + Vite + TS + **CSS puro** + Recharts | ✅ **Manter CSS puro** (decidido em 14/10/2026); Recharts para gráficos |
| Back | **NestJS 11** + **Prisma 7** (`@prisma/adapter-pg`) + PostgreSQL | — (vazio) | Seguir a LUMINA |
| Auth | JWT (access + refresh), bcrypt, Passport, Google OAuth | simulada | Seguir a LUMINA (Google é opcional) |
| Docs API | Swagger em `/docs` | — | Seguir a LUMINA |
| Testes | Vitest + supertest com Prisma fake | — | Seguir a LUMINA |
| Lint | oxlint | oxlint | ✅ já igual |

## 5. O que implementar

### 5.1 Backend (`app/backend`) — NestJS + Prisma
- [x] **Scaffold**, copiando da LUMINA: `config/` (validação de env), `database/` (PrismaService com adapter-pg), `common/` (filtro de exceções, `@CurrentUser`, rate-limit), Swagger e o `docker-compose.yml` do Postgres.
- [x] **Schema Prisma novo**, modelado a partir das funcionalidades da seção 2, sem reaproveitar as tabelas do legado. Proposta inicial:
  - `User` (nome, email único, `passwordHash`, papel)
  - `Plant` (userId, nome, espécie, emoji, local, `humidityMin`, `humidityMax`, `catalogPlantId?`)
  - `PlantCatalog` (catálogo de referência, carregado por **seed** próprio. A lista do `plantas.py` pode servir de ponto de partida, mas tem duplicatas, como Girassol, Coentro e Sálvia, e as faixas precisam ser revisadas)
  - `Device` / sensor (userId, nome, MAC, local, ativo, **hash do token do dispositivo**, plantId)
  - `Reading` (deviceId, plantId, umidade `Decimal(5,2)`, `createdAt`, com índice `(plantId, createdAt)`)
  - `IrrigationEvent` (plantId, início, fim, origem: `manual | auto`)
  - `IrrigationSettings` por planta ou dispositivo (modo `auto|manual`, estado)
  - `NotificationPreference` (horta, email, sistema) e `Alert` (planta, tipo baixo/alto, lido)
- [x] **Módulo `auth`**: register, login, `me`, refresh, change-password, com bcrypt e JWT, igual à LUMINA.
- [x] **Módulo `plants`**: CRUD que sempre filtra pelo usuário do JWT, nunca por um id vindo na URL.
- [x] **Módulo `catalog`**: `GET /catalog?q=` e paginação.
- [x] **Módulo `devices`**: cadastro do sensor, que gera um **token de dispositivo** (exibido uma única vez) e o vincula a uma planta.
- [x] **Ingestão de leituras**: `POST /readings`, autenticado pelo token do dispositivo, com corpo `{ umidade }`. A resposta já informa o **comando de irrigação** (ligar/desligar), conforme o modo e a faixa ideal.
- [x] **Consultas de leitura**: última leitura por planta, histórico por período (`6h|12h|24h|7d`, com agregação por bucket) e estatísticas (média, mín, máx, amplitude, tendência).
- [x] **Módulo `irrigation`**: `POST /plants/:id/irrigation` (ligar/desligar), `PATCH` do modo, histórico de eventos e a regra do modo automático (liga abaixo do mínimo e desliga ao chegar à faixa).
- [x] **Alertas**: gerados quando a leitura sai da faixa, com `GET /alerts` e marcação de lido. Falta o envio por e-mail, que pode reaproveitar o `mailer` da LUMINA.
- [ ] **Relatórios**: exportação em CSV e PDF.
- [ ] **Tempo real** (opcional nesta fase): SSE ou WebSocket para as leituras novas; começar com polling.
- ~~Migração de dados do legado~~: não será feita. O banco é novo e os usuários criam conta de novo.

### 5.2 Frontend (`app/frontend`)
- [ ] Criar um **cliente HTTP** (`lib/api.ts`) com o token JWT e o refresh, no padrão do `api-client-core.ts` da LUMINA.
- [ ] Trocar o `AuthContext` simulado pelo login real e adicionar as telas de **cadastro** e **esqueci a senha**.
- [ ] Trocar o `mockData.ts` e o `PlantsContext` por chamadas à API. Avaliar o uso do TanStack Query para cache e polling.
- [ ] Criar o **formulário de nova planta**, com autocomplete do catálogo.
- [ ] Criar a tela de **dispositivos**: cadastrar o sensor, mostrar o token e vincular a uma planta.
- [ ] Ligar os botões de irrigação e o modo automático à API, incluindo a tela do Watch.
- [ ] Ligar as notificações do sino aos alertas reais e salvar os toggles de Configurações.
- [ ] Gráfico com a faixa ideal sobreposta, estatísticas de amplitude e tendência, e relatório em PDF.
- [ ] Code-splitting por rota: o bundle tem 685 kB hoje e o Vite avisa acima de 500 kB.
- [ ] Remover a `VITE_API_KEY` da tela de Configurações: uma chave no front fica exposta para qualquer pessoa.

### 5.3 Hardware / Firmware (`hardware-firmware/`)
- [ ] Firmware ESP32: ler o sensor capacitivo de umidade com **calibração** (seco e molhado), em vez do `map(0,1023)`, que está errado para o ADC de 12 bits do ESP32.
- [ ] Enviar `POST /readings` em JSON, por HTTPS, com o token do dispositivo.
- [ ] Acionar a **válvula ou bomba** (relé ou MOSFET) conforme o comando da resposta, com um timeout de segurança no próprio dispositivo.
- [ ] Configurar o Wi-Fi sem senha fixa no código (WiFiManager ou portal de configuração).
- [ ] Documentar o esquemático, a lista de componentes e a pinagem em `hardware-firmware/hardware/`.

### 5.4 Infra
- [x] `docker-compose` com Postgres para desenvolvimento.
- [ ] Deploy: front na Vercel (como a landing page) e API e Postgres num serviço gerenciado.
- [ ] CI com typecheck, lint, testes e build para o front e o back.

## 6. Ordem sugerida
1. Scaffold do backend, schema Prisma e seed do catálogo
2. Auth de ponta a ponta (back e front)
3. CRUD de plantas e catálogo, com o front saindo dos mocks
4. Dispositivos e ingestão de leituras, com o firmware enviando dados reais
5. Histórico, estatísticas e gráficos com dados reais
6. Irrigação manual e automática, de ponta a ponta até o relé
7. Alertas, notificações e relatórios
