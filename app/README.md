# App

O aplicativo do EcoTech tem duas partes:

| Pasta | O que é | Porta local |
|---|---|---|
| [`backend/`](backend/) | API REST (NestJS + Prisma + PostgreSQL). É a fonte da verdade: guarda os dados, recebe as leituras das placas e decide a irrigação automática | `3333` (Swagger em `/docs`) |
| [`frontend/`](frontend/) | Painel web (React + Vite + TypeScript) | `5173` |

## Como as duas partes se ligam

- O frontend chama o backend na URL de `VITE_API_URL` (arquivo `frontend/.env`). Sem essa variável, o frontend usa dados simulados e não precisa do backend.
- O login é por e-mail e senha. O backend devolve um access token (15 min) e um refresh token (7 dias), e o frontend renova a sessão sozinho quando o access token vence.
- O backend só aceita chamadas das origens listadas em `CORS_ORIGIN` (arquivo `backend/.env`). O padrão é `http://localhost:5173`, a porta do Vite.
- Os nomes no backend são em inglês (`plants`, `idealMin`) e no frontend em português (`plantas`, `faixaMin`). A conversão fica toda em `frontend/src/api/mappers.ts`.

Para subir os dois, siga o [README da raiz](../README.md#como-rodar-o-app).
