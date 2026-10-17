# Backend

API do EcoTech: contas, plantas, culturas, placas (ESP32/Arduino), leituras, irrigação, alertas e relatórios de água.

**Stack:** NestJS 11, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL 17, JWT (access + refresh), bcrypt, Swagger e Vitest. É a mesma base da LUMINA.

## Como rodar

Pré-requisitos: **Node.js 20.19+, 22.12+ ou 24+** (exigência do Prisma 7) e **Docker** (ou um PostgreSQL próprio, ajustando `DATABASE_URL`).

```bash
cp .env.example .env          # preencha JWT_SECRET e JWT_REFRESH_SECRET
docker compose up -d          # Postgres local na porta 5432
npm install                   # também roda `prisma generate`
npm run prisma:migrate:deploy # cria as tabelas
npm run prisma:seed           # carrega o catálogo de plantas
npm run start:dev             # http://localhost:3333 (Swagger em /docs)
```

Para gerar os segredos do JWT: `openssl rand -hex 32` (um para cada variável).

### Variáveis de ambiente

A API valida o `.env` ao subir e não inicia se faltar algo obrigatório (`src/config/env.validation.ts`).

| Variável | Obrigatória | Padrão no `.env.example` | Para quê |
|---|---|---|---|
| `DATABASE_URL` | sim | Postgres do `docker-compose.yml` | Conexão com o banco |
| `PORT` | sim | `3333` | Porta da API |
| `CORS_ORIGIN` | sim | `http://localhost:5173` | Origens liberadas, separadas por vírgula |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | sim | (vazio) | Segredos dos tokens, com pelo menos 16 caracteres e diferentes entre si |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | sim | `15m` / `7d` | Validade do access e do refresh token |
| `RATE_LIMIT_TTL_MS` / `RATE_LIMIT_MAX` | não | `60000` / `300` | Limite de requisições por IP na janela |
| `WATER_TARIFF_PER_M3` | não | `6.48` | Tarifa de água (R$/m³) usada nos relatórios |

### Scripts

| Comando | O que faz |
|---|---|
| `npm run start:dev` | Compila e sobe com recarga automática |
| `npm run build` / `npm start` | Compila para `dist/` e roda a versão compilada |
| `npm test` | Testes unitários e e2e |
| `npm run typecheck` | Checa os tipos sem gerar arquivos |
| `npm run prisma:migrate:dev` | Cria uma migration nova a partir do `schema.prisma` (desenvolvimento) |
| `npm run prisma:migrate:deploy` | Aplica as migrations pendentes |
| `npm run prisma:studio` | Abre o Prisma Studio para ver os dados |

### Testes

`npm test` roda os testes unitários das regras de `src/domain` e um e2e (`test/app.e2e-spec.ts`) que sobe a aplicação inteira com um Prisma em memória (`test/fake-prisma.ts`), sem precisar de banco. Como o fake não executa SQL, as migrations só são validadas rodando `prisma:migrate:deploy` num Postgres de verdade.

### Testar uma leitura sem placa

Com uma placa criada em `POST /devices` (o `token` vem na resposta):

```bash
curl -X POST http://localhost:3333/readings \
  -H "X-Device-Token: etk_..." -H "Content-Type: application/json" \
  -d '{"rawValue": 2240, "temperature": 26.4}'
```

O contrato completo com a placa está no [README do firmware](../../hardware-firmware/firmware/README.md).

## Estrutura

| Pasta | O que faz |
|---|---|
| `prisma/schema.prisma` | Banco novo: `User`, `PlantCatalog`, `Crop`, `Plant`, `Device`, `Reading`, `IrrigationSettings`, `IrrigationEvent`, `NotificationPreference`, `Alert` |
| `prisma/seed.ts` | Carrega o catálogo de 249 plantas (`seed-data/plant-catalog.ts`) |
| `src/domain` | Regras puras: limites e status de umidade, irrigação automática e manual, secagem, calibração, alertas de ambiente e economia de água |
| `src/auth` | Cadastro, login, refresh, `me` e troca de senha |
| `src/users` | Perfil e preferências de notificação |
| `src/catalog` | Busca no catálogo (autocomplete) |
| `src/crops` | Culturas e seus parâmetros ideais |
| `src/plants` | CRUD de plantas, sempre filtrado pelo usuário do token |
| `src/devices` | Placas: cadastro, token, calibração e status online |
| `src/readings` | Ingestão da placa e consultas (lista, histórico, estatísticas, coleta) |
| `src/irrigation` | Modo AUTO/MANUAL, liga/desliga com duração, vazão e histórico de ciclos |
| `src/alerts` | Alertas de umidade, reservatório, temperatura e estresse hídrico |
| `src/reports` | Relatório de água: consumo, economia e custo por dia |

## Endpoints

Todas as rotas usam `Authorization: Bearer <accessToken>`, menos as de auth públicas, `/health` e `POST /readings`. Os intervalos (`from`/`to`) são ISO 8601.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` · `/auth/login` · `/auth/refresh` | Devolvem `{ accessToken, refreshToken, user }` |
| GET | `/auth/me` | Usuário autenticado |
| PATCH | `/auth/password` | Troca a senha e invalida os tokens antigos |
| PATCH | `/users/me` | Atualiza o nome |
| GET/PATCH | `/users/me/notifications` | Preferências: `garden`, `email`, `system` |
| GET | `/catalog?q=&page=&limit=` | Busca por nome popular ou científico (mínimo 2 letras) |
| GET/POST | `/crops` | Culturas: temperatura, luz, irrigações por dia e ciclo |
| PATCH/DELETE | `/crops/:id` | Edita ou remove (as plantas ficam sem cultura) |
| GET/POST | `/plants` | Lista e cria. Com `catalogPlantId`, nome, espécie e faixa ideal vêm do catálogo; limites não enviados são derivados da faixa |
| GET/PATCH/DELETE | `/plants/:id` | A resposta traz os limites, `latestReading`, `temperature`, `status`, `dryingRatePerHour` e `irrigation` (com o ciclo aberto) |
| GET/POST | `/devices` | O `POST` devolve o `token`, que só aparece nessa resposta |
| GET/PATCH/DELETE | `/devices/:id` | Edita, ativa/desativa, vincula a uma planta, profundidade e posição. A resposta traz `online`, a calibração e a última leitura |
| PUT | `/devices/:id/calibration` | `{ board, rawDry, rawWet }`, validado pela escala da placa |
| POST | `/devices/:id/token` | Gera um token novo e invalida o anterior |
| POST | `/readings` | **Placa**: header `X-Device-Token`, corpo com `rawValue` (ou `humidity`), `temperature`, `airHumidity`, `leafTemperature`, `light` e `waterLevel`, todos opcionais |
| GET | `/readings?from=&to=` | Leituras de todas as placas (até 31 dias), para a coleta de dados |
| GET | `/plants/:id/readings?period=` | Leituras de umidade (`6h`, `12h`, `24h` ou `7d`) |
| GET | `/plants/:id/readings/history?period=` | Buckets com média, mín e máx, para o gráfico |
| GET | `/plants/:id/readings/stats?period=` | Atual, média, mín, máx, amplitude e tendência |
| GET/PATCH | `/plants/:id/irrigation` | Modo (`AUTO`/`MANUAL`), estado, bloqueio do automático e vazão (`flowRateLpm`) |
| POST | `/plants/:id/irrigation` | `{ "on": true, "durationMin": 5 }` liga (a duração é opcional); `{ "on": false }` desliga |
| GET | `/plants/:id/irrigation/events` | Ciclos da planta |
| GET | `/irrigation/events?from=&to=` | Ciclos de todas as plantas (até 90 dias), com litros e umidade antes/depois |
| GET | `/reports/water?from=&to=&tz=` | Por dia: água usada, referência de horário fixo, umidade média, plantas críticas e alertas; mais economia e custo do período |
| GET | `/alerts?unread=true` | Alertas |
| PATCH / POST | `/alerts/:id/read` · `/alerts/read-all` | Marca um alerta ou todos como lidos |

## Regras de negócio

Ficam em `src/domain` (`humidity.ts`, `sensors.ts`, `water.ts`), sem framework, com testes unitários. São as mesmas regras que o front simulava em `src/utils`.

- **Limites da planta:** `humidityCritical < humidityLow <= idealMin < idealMax <= humidityHigh`. Os que não forem enviados no cadastro saem da faixa ideal: mínima 5 pontos abaixo, máxima 10 acima e crítica 5 abaixo da mínima.
- **Status:** `CRITICAL` abaixo da crítica, `LOW` abaixo da mínima, `HIGH` acima da máxima e `IDEAL` no resto (no front: Crítico, Atenção e Normal).
- **Irrigação automática:** liga quando a umidade fica crítica e desliga ao chegar no início da faixa ideal, ou depois de 20 minutos (proteção contra sensor com defeito). Se o usuário desliga com o solo ainda crítico, o automático fica bloqueado até a umidade sair do nível crítico.
- **Irrigação manual:** desliga na duração pedida (`durationMin`) ou quando o solo passa da máxima. Cada ciclo guarda o motivo, a umidade antes e depois e os litros (minutos × vazão).
- **Resposta à placa:** `POST /readings` devolve `{ status, irrigation: "ON" | "OFF", maxRunSec }`. Com `maxRunSec`, o firmware desliga sozinho mesmo se perder a conexão.
- **Calibração:** a placa envia o valor bruto do ADC (Arduino 0–1023, ESP32 0–4095) e o sistema converte em % com a calibração seco/molhado do dispositivo, ou com a padrão da placa.
- **Online:** a placa é considerada offline sem leitura há mais de 5 minutos.
- **Alertas:** umidade `CRITICAL`/`LOW`/`HIGH`, `RESERVOIR_LOW` (nível < 20%, da placa), `HIGH_TEMPERATURE` (> 32 °C) e `WATER_STRESS` (folha ≥ 3 °C acima do ar). Enquanto houver um alerta não lido do mesmo tipo para a planta (ou placa), nenhum novo é criado. Com a preferência `garden` desligada, nenhum alerta é criado.
- **Economia de água:** comparada com uma irrigação de horário fixo: `irrigationsPerDay` da cultura (ou 1) × 4 minutos × vazão, por planta e por dia. O custo usa `WATER_TARIFF_PER_M3` (padrão R$ 6,48/m³).
- **Token do dispositivo:** tem o formato `etk_…` e só o hash SHA-256 fica no banco.

## Ainda falta

- **Previsão do tempo:** o front usa clima simulado. Falta integrar um serviço (ex.: Open-Meteo) pela localização da horta.
- **Fotos das plantas:** ficam só na memória do navegador. Falta upload e armazenamento.
- **Pedir leitura à placa** ("Registrar leitura agora") e **tempo real** (SSE ou WebSocket). Por enquanto o front faz polling a cada 15 s.
- **Encerrar ciclos sem leitura:** os limites de tempo da irrigação só são checados quando chega uma leitura. Se a placa parar de enviar, o ciclo fica aberto no banco (o firmware se protege com `maxRunSec`). Falta um job periódico.
- **Sensor travado e consumo anômalo** no servidor: hoje o front calcula com os dados que recebe. Os alertas gravados pelo servidor ainda não aparecem no sino do front, que gera os seus a partir do estado.
- **Tarifa por usuário**, relatórios em PDF, alertas por e-mail e recuperação de senha.
- **Refresh token em cookie httpOnly**, em vez de no corpo da resposta.
