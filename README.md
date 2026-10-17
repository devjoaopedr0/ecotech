# EcoTech

Sistema de irrigação inteligente para hortas. Uma placa (ESP32 ou Arduino) mede a umidade do solo e outras grandezas, a API decide quando irrigar e o painel web mostra o estado da horta e permite controlar a irrigação.

```
┌──────────────┐  POST /readings   ┌──────────────┐   REST + JWT   ┌──────────────┐
│  Placa       │ ────────────────▶ │  Backend     │ ◀────────────▶ │  Frontend    │
│  ESP32 /     │ ◀──────────────── │  NestJS +    │                │  React +     │
│  Arduino     │  comando ON/OFF   │  PostgreSQL  │                │  Vite        │
└──────────────┘                   └──────────────┘                └──────────────┘
```

A placa envia o valor bruto do sensor de umidade com um token próprio. A resposta da API traz o comando de irrigação (`ON`/`OFF`) que a placa aplica na bomba.

## Estrutura do repositório

| Pasta | Conteúdo | Estado |
|---|---|---|
| [`app/backend/`](app/backend/) | API: contas, plantas, placas, leituras, irrigação, alertas e relatórios (NestJS, Prisma, PostgreSQL) | Funcional, com testes |
| [`app/frontend/`](app/frontend/) | Painel web (React 19, Vite, TypeScript), importado de [ecotech-sistema-front](https://github.com/Marcos023-Mv/ecotech-sistema-front) | Funcional; roda com o backend ou com dados simulados |
| [`hardware-firmware/`](hardware-firmware/) | Esquemáticos, PCB, lista de componentes e firmware | Ainda sem arquivos |
| [`landing-page/`](landing-page/) | Site de apresentação (HTML, CSS e JS), importado de [ecotech-template](https://github.com/devjoaopedr0/ecotech-template). Publicado em https://irrigaai.vercel.app | Publicado |
| [`docs/`](docs/) | Análise do sistema legado e roadmap | — |

## Como rodar o app

Pré-requisitos: Node.js 20.19+ (ou 22.12+) e Docker (para o PostgreSQL local).

```bash
# 1. Backend: http://localhost:3333, Swagger em /docs
cd app/backend
cp .env.example .env            # preencha JWT_SECRET e JWT_REFRESH_SECRET
docker compose up -d
npm install
npm run prisma:migrate:deploy
npm run prisma:seed
npm run start:dev
```

```bash
# 2. Frontend: http://localhost:5173
cd app/frontend
cp .env.example .env            # VITE_API_URL=http://localhost:3333
npm install
npm run dev
```

Crie uma conta em `POST /auth/register` (pelo Swagger) e entre com ela no painel. Sem `VITE_API_URL`, o frontend roda sozinho com dados simulados e aceita qualquer login.

Os detalhes de cada parte estão no README do [backend](app/backend/README.md) e do [frontend](app/frontend/README.md).

## Documentação

- [docs/ANALISE_E_ROADMAP.md](docs/ANALISE_E_ROADMAP.md): análise do legado, estado atual e o que falta implementar.
- [app/backend/README.md](app/backend/README.md): endpoints, regras de negócio e o que ainda falta na API.
- [hardware-firmware/firmware/README.md](hardware-firmware/firmware/README.md): o que o firmware precisa fazer para falar com a API.
