# Backend

API do EcoTech: contas, plantas, sensores (ESP32), leituras de umidade, irrigação e alertas.

**Stack:** NestJS 11, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL, JWT (access + refresh), bcrypt, Swagger e Vitest. É a mesma base da LUMINA.

## Como rodar

```bash
cp .env.example .env          # preencha JWT_SECRET e JWT_REFRESH_SECRET
docker compose up -d          # Postgres local na porta 5432
npm install                   # também roda `prisma generate`
npm run prisma:migrate:deploy # cria as tabelas
npm run prisma:seed           # carrega o catálogo de plantas
npm run start:dev             # http://localhost:3333 (Swagger em /docs)
```

Testes: `npm test`. São testes unitários das regras de umidade e um e2e que sobe a aplicação inteira com um Prisma em memória, sem precisar de banco.

## Estrutura

| Pasta | O que faz |
|---|---|
| `prisma/schema.prisma` | Banco novo: `User`, `PlantCatalog`, `Plant`, `Device`, `Reading`, `IrrigationSettings`, `IrrigationEvent`, `NotificationPreference`, `Alert` |
| `prisma/seed.ts` | Carrega o catálogo de 249 plantas (`seed-data/plant-catalog.ts`) |
| `src/domain/humidity.ts` | Regras puras: status, decisão da irrigação automática, buckets do histórico e estatísticas |
| `src/auth` | Cadastro, login, refresh, `me` e troca de senha |
| `src/users` | Perfil e preferências de notificação |
| `src/catalog` | Busca no catálogo (autocomplete) |
| `src/plants` | CRUD de plantas, sempre filtrado pelo usuário do token |
| `src/devices` | Cadastro de sensores e token do dispositivo |
| `src/readings` | Ingestão do ESP32 e consultas (lista, histórico, estatísticas) |
| `src/irrigation` | Modo AUTO/MANUAL, liga/desliga e histórico de ciclos |
| `src/alerts` | Alertas de planta fora da faixa |

## Endpoints

Todas as rotas usam `Authorization: Bearer <accessToken>`, menos as de auth públicas, `/health` e `POST /readings`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` · `/auth/login` · `/auth/refresh` | Devolvem `{ accessToken, refreshToken, user }` |
| GET | `/auth/me` | Usuário autenticado |
| PATCH | `/auth/password` | Troca a senha e invalida os tokens antigos |
| PATCH | `/users/me` | Atualiza o nome |
| GET/PATCH | `/users/me/notifications` | Preferências: `garden`, `email`, `system` |
| GET | `/catalog?q=&page=&limit=` | Busca por nome popular ou científico (mínimo 2 letras) |
| GET/POST | `/plants` | Lista e cria. Com `catalogPlantId`, nome, espécie e faixa vêm do catálogo |
| GET/PATCH/DELETE | `/plants/:id` | A resposta traz `latestReading`, `status` e `irrigation` |
| GET/POST | `/devices` | O `POST` devolve o `token`, que só aparece nessa resposta |
| GET/PATCH/DELETE | `/devices/:id` | Edita, ativa ou desativa, e vincula a uma planta (`plantId`) |
| POST | `/devices/:id/token` | Gera um token novo e invalida o anterior |
| POST | `/readings` | **ESP32**: header `X-Device-Token`, corpo `{ "humidity": 47.5 }` |
| GET | `/plants/:id/readings?period=` | Leituras brutas (`6h`, `12h`, `24h` ou `7d`) |
| GET | `/plants/:id/readings/history?period=` | Buckets com média, mín e máx, para o gráfico |
| GET | `/plants/:id/readings/stats?period=` | Atual, média, mín, máx, amplitude e tendência |
| GET | `/plants/:id/irrigation` | Modo e estado |
| PATCH | `/plants/:id/irrigation/mode` | `{ "mode": "AUTO" \| "MANUAL" }` |
| POST | `/plants/:id/irrigation` | `{ "on": true \| false }` |
| GET | `/plants/:id/irrigation/events` | Histórico de ciclos |
| GET | `/alerts?unread=true` | Alertas |
| PATCH / POST | `/alerts/:id/read` · `/alerts/read-all` | Marca um alerta ou todos como lidos |

## Regras de negócio

- **Status** (por leitura, comparado com a faixa da planta): `LOW` abaixo do mínimo, `HIGH` acima do máximo, `ATTENTION` nos 15% inferiores da faixa e `IDEAL` no resto.
- **Irrigação automática:** liga abaixo do mínimo e desliga quando a umidade volta ao `IDEAL` (ou passa do máximo). Na zona de atenção o estado é mantido, para evitar liga-desliga perto do mínimo.
- **Resposta ao ESP32:** `POST /readings` devolve `{ status, irrigation: "ON" | "OFF" }`, e o firmware aplica o comando na válvula ou bomba.
- **Alertas:** são criados quando a leitura fica `LOW` ou `HIGH`. Enquanto houver um alerta não lido do mesmo tipo para a planta, nenhum novo é criado. Com a preferência `garden` desligada, nenhum alerta é criado.
- **Token do dispositivo:** tem o formato `etk_…` e só o hash SHA-256 fica no banco.

## Ainda falta

Relatórios (CSV e PDF), envio de alertas por e-mail, recuperação de senha e tempo real (SSE ou WebSocket; por enquanto o front faz polling).
