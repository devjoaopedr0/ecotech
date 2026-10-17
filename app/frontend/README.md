
# 🌿 Ecotech Solutions — Sistema de Irrigação Inteligente

## 📖 Sobre o projeto

O **Ecotech Solutions** é um sistema web para monitorar e controlar a irrigação de uma horta ou jardim de forma inteligente. A ideia é simples: sensores (reais ou simulados) medem a umidade do solo de cada planta, e o sistema mostra esses dados em telas claras, avisa quando alguma planta precisa de atenção e permite ligar/desligar a irrigação — automática ou manualmente.

Este repositório contém **apenas o front-end** (a interface visual e a lógica de tela), construído em **React + TypeScript + Vite**. Hoje os dados de exemplo (plantas, histórico de umidade, leituras) são simulados dentro do próprio projeto, prontos para no futuro serem conectados a uma API real através da variável `VITE_API_URL`.

> 📜 O histórico de alterações, com o que foi feito em cada commit, está em [CHANGELOG.md](CHANGELOG.md).

### Telas do sistema

| Tela | O que faz |
| --- | --- |
| **Login** | Tela de entrada do sistema, com usuário e senha |
| **Cadastro** | Criação de conta com nome, e-mail, usuário, senha e um questionário sobre o nível de conhecimento em tecnologia |
| **Visão Geral** | Resumo rápido: saúde da horta, umidade atual, alertas e últimas leituras |
| **Dashboard** | Gráficos, estatísticas e geração de relatório de irrigação (CSV) |
| **Monitor** | Acompanhamento em tempo real de uma planta específica, com controles de irrigação (ligar, desligar, automático, manual) |
| **Relatórios** | Consumo, economia, irrigações, umidade média, plantas críticas, alertas e sensores — filtros Hoje, 7 dias, 30 dias e Personalizado |
| **Sensores** | Lista de sensores (umidade, temperatura, luminosidade, nível da água) com status, valor atual, localização e última atualização |
| **Plantas** | Lista de todas as plantas cadastradas, com busca, edição da faixa ideal de umidade e exclusão |
| **Configurações** | Tema claro/escuro, dados do perfil, troca de senha, notificações e logout |

### Tecnologias utilizadas

- **Vite** — build e servidor de desenvolvimento
- **React 19** — biblioteca de interface
- **TypeScript** — tipagem estática
- **React Router** — navegação entre as telas
- **Recharts** — gráficos de umidade
- **CSS puro** (variáveis/tokens de tema) — sem frameworks de UI, para manter fidelidade total ao design de referência

---

## ▶️ Como rodar o projeto (passo a passo)

### 1. Pré-requisitos

Você precisa ter o **Node.js** instalado no computador (versão 18 ou superior). Para verificar se já tem, abra o terminal e digite:

```bash
node -v
```

Se aparecer um número de versão (ex: `v20.11.0`), está tudo certo. Se der erro, baixe e instale o Node.js em **https://nodejs.org** (escolha a versão "LTS").

O `npm` (gerenciador de pacotes) já vem junto com o Node.js — não precisa instalar separado.

### 2. Extrair e abrir o projeto

Extraia o arquivo `.zip` recebido em uma pasta de sua preferência e abra essa pasta no terminal:

```bash
cd caminho/para/ecotech-solutions
```

### 3. Instalar as dependências

Este comando baixa todas as bibliotecas que o projeto usa (React, Vite, etc.) para dentro da pasta `node_modules`:

```bash
npm install
```

Isso pode levar de 1 a 3 minutos, dependendo da sua internet.

### 4. Configurar as variáveis de ambiente

O projeto já vem com um arquivo `.env` pronto para uso local (não precisa fazer nada). Se quiser recriá-lo do zero, copie o modelo:

```bash
cp .env.example .env
```

Depois, se for conectar a uma API real no futuro, edite o `.env` e ajuste:

```
VITE_API_URL=http://localhost:3333
VITE_API_KEY=sua-chave-aqui
```

> ⚠️ O arquivo `.env` nunca deve ser enviado para o Git/GitHub — ele já está listado no `.gitignore` por segurança.

### 5. Rodar o projeto em modo desenvolvimento

```bash
npm run dev
```

O terminal vai mostrar algo como:

```
Local:   http://localhost:5173/
```

Abra esse endereço no navegador. Você verá a tela de **Login**.

> 🔑 O login é simulado (não existe backend ainda). Digite **qualquer usuário e qualquer senha** (não podem ficar vazios) e clique em **Entrar**.

Enquanto o `npm run dev` estiver rodando, qualquer alteração que você fizer no código atualiza a tela automaticamente (hot reload). Para parar o servidor, use `Ctrl + C` no terminal.

### 6. Gerar a versão de produção (opcional)

Quando quiser gerar os arquivos finais otimizados para colocar em um servidor/hospedagem:

```bash
npm run build
```

Isso cria uma pasta `dist/` com o site pronto. Para conferir localmente como ficou o build de produção:

```bash
npm run preview
```

---

## 🧩 O que já está funcional na interface

- **Login**: validação de campos, mostrar/ocultar senha, loading no botão "Entrar", redireciona para a Visão Geral. Link "Cadastre-se" leva à tela de cadastro e, ao voltar de um cadastro, exibe a mensagem de sucesso.
- **Cadastro** (`/cadastro`): formulário com questionário Muito / Médio / Pouco, mostrar/ocultar senha, loading no botão "Cadastrar" e retorno ao login. A validação já está estruturada, mas desativada (veja a seção *Cadastro e questionário*).
- **Sidebar**: navegação real entre todas as páginas, item ativo destacado. Em telas pequenas vira um menu lateral (☰) com overlay.
- **Header**: sino de notificações e avatar do usuário abrem menus reais; "Sair do sistema" desloga e volta pro login.
- **Plantas**: busca em tempo real, clique na planta ou no ícone de lápis abre o formulário de edição (nome e faixa ideal), "Salvar" atualiza a lista, "Cancelar" reverte, lixeira abre confirmação e remove a planta, paginação funcional.
- **Monitor**: seletor de planta atualiza todo o painel. Botões **Ligar/Desligar** e **Automático/Manual** trocam o estado real de irrigação (refletido também na Visão Geral). Botões 6h/12h/24h/7d trocam os dados do gráfico.
- **Dashboard**: filtro de período, botão **Gerar Relatório de Irrigação** baixa um CSV real, link "Ver todas" expande a tabela de leituras.
- **Configurações**: tema escuro/claro aplica de verdade em todo o app (salvo no navegador), toggles de notificação funcionam, "Alterar senha" abre modal com validação, "Sair" desloga.

---

## 📁 Estrutura de pastas

```
src/
├── components/   # Botões, Cards, Modal, Tabela, Inputs, Sidebar, Header, ícones
├── pages/        # Login, Cadastro, VisaoGeral, Dashboard, Monitor, Plantas, Sensores, Relatorios, Configuracoes
├── layouts/      # MainLayout (sidebar + conteúdo)
├── context/      # AuthContext, ThemeContext, PlantsContext (estado global)
├── hooks/        # (reservado para hooks customizados futuros)
├── types/        # Tipos TypeScript do domínio
├── utils/        # Dados mockados e helpers
└── styles/       # theme.css (tokens de cor) e common.css (classes compartilhadas)
```

## 🔧 Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | URL base da API do backend (quando existir) |
| `VITE_API_KEY` | Chave usada na área técnica de Configurações |

## 🔌 Próximos passos sugeridos

- Conectar `VITE_API_URL` a um backend real (hoje os dados são mockados em `src/utils/mockData.ts` e mantidos em memória via Context API).
- Trocar a autenticação simulada (`sessionStorage`) por um backend real de login.
- Persistir as plantas cadastradas em um banco de dados em vez de estado em memória.
- Ativar as regras de validação do cadastro e enviar os dados para o backend.

---

## 💧 Umidade crítica, irrigação e economia de água

Funcionalidades adicionadas sobre o sistema existente (sem alterar layout/estilo):

- **Limites de umidade por planta** (tela *Plantas → Editar planta*): crítica, mínima, faixa ideal e máxima.
  Regra de status (`src/utils/umidade.ts`): **Crítico** abaixo da crítica · **Atenção** abaixo da mínima ou acima da máxima · **Normal** no restante.
- **Alertas** (`src/utils/alertas.ts`): umidade crítica, umidade baixa/alta, sensor offline, reservatório baixo (< 20%), temperatura elevada (> 32 °C), irrigação iniciada/concluída. Aparecem na Visão Geral, no Monitor (por planta) e no sino do Header.
- **Irrigação por planta** (tela *Monitor*): Ligar/Desligar, modo Automático/Manual, tempo de irrigação, status e histórico. No modo automático, a irrigação começa sozinha ao detectar umidade crítica e para ao voltar à faixa ideal; no manual o sistema apenas recomenda iniciar a irrigação.
- **Histórico** de umidade (com a linha da umidade crítica) e de irrigação (data, horário, duração, tipo, motivo, litros). O relatório CSV do Dashboard inclui essas colunas.
- **Água utilizada / economizada / % de economia** no Dashboard — *"Mais verde, menos desperdício."*
- **Sensores** (nova rota `/sensores`) e informações extras de cada planta (temperatura, última irrigação, consumo).

### ⚠️ Dados simulados (sem backend)

Não existe backend nem hardware conectado. Todos os dados vêm de `src/utils/mockData.ts` e a irrigação é **simulada**: a cada ~1,5 s reais passa 1 minuto simulado e o solo ganha 2 pontos de umidade. A vazão simulada é de 2 L/min e a economia é estimada em relação a uma irrigação convencional de horário fixo.

### 🔌 Preparação para API / IoT

`src/api/types.ts` define o contrato (`EcotechApi`) com o futuro backend — listar plantas, sensores, histórico e consumo, e enviar comandos de irrigação (que o backend repassa ao ESP32/Arduino). Hoje as telas usam `mockEcotechApi`; ao definir `VITE_API_URL` o app passa a usar `httpEcotechApi` (`src/api/ecotechApi.http.ts`). O `PlantsContext` já chama `enviarComandoIrrigacao` sempre que uma irrigação liga/desliga, e as telas só consomem o contexto.

---

## 🤖 Inteligência da horta

Todas as regras são funções puras em `src/utils/analise.ts` (fáceis de testar e de trocar por um serviço de IA/backend):

| Funcionalidade | Onde aparece | Regra resumida |
|---|---|---|
| Previsão do tempo | Visão Geral | Temperatura, condição, máx./mín., probabilidade e horário da chuva (mock) |
| Recomendações | Visão Geral | Irrigar plantas em modo manual que ficarão críticas em ≤ 3 h; adiar irrigação quando a chuva (≥ 60%) chega antes de a planta ficar crítica |
| Previsão de umidade | Monitor | Queda por hora (ajustada pela temperatura) para Agora / 1 h / 2 h / 3 h e aviso de quando atinge o nível crítico |
| Saúde da planta (0–100) | Monitor | Umidade 50% · temperatura 20% · luminosidade 15% · frequência de irrigação 15% → Saudável ≥ 80, Atenção 60–79, Crítico < 60 |
| Anomalias (alertas) | Visão Geral / sino | Sensor com leitura parada ≥ 12 h; consumo ≥ 25% acima da média; ≥ 4 irrigações em 6 h na mesma planta |
| Custo e economia | Dashboard / Relatórios | Litros × tarifa simulada (R$ 6,48/m³) |
| Eficiência da Ecotech | Visão Geral | Economia 25% · saúde 30% · sensores 15% · alertas 15% · uso inteligente da água 15% |
| Culturas | Plantas | Temperatura, luminosidade, irrigações/dia e ciclo por cultura (editáveis); limites de umidade continuam por planta |
| Colheita | Monitor | Data de plantio (editável) + ciclo da cultura |
| Histórico visual | Plantas | Fotos por planta ("Dia N" desde o plantio), reduzidas no navegador |

Observações: o clima, os históricos diários e a taxa de secagem são **simulados** (`mockData.ts`); as fotos ficam apenas em memória até existir backend. A exportação de relatórios ainda não foi implementada. Anomalia de consumo aparece só como alerta (não se repete nas recomendações).

---

## 🧭 Roteiro IrrigaAI → o que o front-end já cobre

| Etapa (anotações) | No sistema | Falta (hardware / dados reais) |
|---|---|---|
| 1. Sensores e calibração | *Sensores → Calibrar*: placa **Arduino (0–1023)** ou **ESP32 (0–4095)**, leitura bruta no ar (0%) e na água (100%), prévia ao vivo e validação. O valor bruto é preservado ao recalibrar; só a conversão para % muda (`utils/calibracao.ts`). | Medir os valores de seco/molhado de cada sensor real |
| 2. Manejo do solo | Faixas: **Seco** (abaixo da mínima), **Adequado**, **Excesso de água** (acima da máxima) e umidade crítica por planta | Definir as faixas da cultura escolhida em campo |
| 3. Acionamento remoto | Ligar/Desligar por planta; cada comando passa por `ecotechApi.enviarComandoIrrigacao` (hoje simulado) | Backend + ESP32 acionando a bomba |
| 4. Testes de irrigação | Cada irrigação registra **umidade antes → depois**; o Monitor sugere o tempo de bomba (~N min) pela resposta média medida | Resposta real do solo ao gotejamento |
| 5. Coleta de dados | *Relatórios → Dados coletados*: leituras brutas + % nas fases antes/durante/depois, **Registrar leitura agora** e **Exportar CSV** (com placa, profundidade e posição do sensor) | Gravar as leituras reais em banco |
| 6. Cultura | Parâmetros por cultura editáveis (Plantas) | Escolher a cultura de referência |
| 7. Planta e clima | Sensores de **temperatura foliar** e **umidade do ar**; alerta de possível estresse hídrico quando a folha fica ≥ 3 °C acima do ar; previsão do tempo | Ligar os sensores reais |
| 8. IA preditiva | Regras de previsão de umidade e recomendações (`utils/analise.ts`) como base; decisões usam faixas e tendência (queda por hora), não leituras isoladas | Treinar modelos quando houver dados reais |
| 9. Estrutura (case, solar, LoRa) | — não se aplica ao front-end | Prototipagem física e testes de alcance em campo |

`PUT /sensores/:id/calibracao` está em `src/api/endpoints.ts`: o dispositivo envia apenas o valor bruto e a calibração fica no sistema.

---

## 🗂️ API e rotas separadas

```
src/api/                    ← só comunicação com o backend
  types.ts                  contrato `EcotechApi` (o que as telas podem pedir)
  endpoints.ts              todas as URLs/caminhos da API
  client.ts                 fetch (VITE_API_URL, VITE_API_KEY) e `ApiError`
  ecotechApi.http.ts        implementação real (REST)
  ecotechApi.mock.ts        implementação simulada (dados de utils/mockData.ts)
  index.ts                  exporta `ecotechApi`: HTTP se VITE_API_URL existir, senão mock

src/routes/                 ← só navegação
  paths.ts                  todos os caminhos das telas (`ROTAS`)
  routeConfig.ts            tabela de telas autenticadas (`ROTAS_PRIVADAS`)
  AppRoutes.tsx             monta as rotas (desktop e Apple Watch)
  ProtectedRoute.tsx        redireciona para /login sem sessão
```

- **Nova tela:** crie a página, adicione o caminho em `routes/paths.ts` e uma linha em `routes/routeConfig.ts` (e o item no Sidebar, se aparecer no menu).
- **Novo endpoint:** declare em `api/endpoints.ts`, o método em `api/types.ts` e implemente em `ecotechApi.http.ts` e `ecotechApi.mock.ts`.
- `App.tsx` só monta os providers e o `AppRoutes`.

---

## 📝 Cadastro e questionário

Tela pública em `/cadastro` (acessível pelo link **Cadastre-se** no login; não existe na versão do Apple Watch).

- **Campos:** nome completo, e-mail, usuário, senha e confirmar senha.
- **Questionário:** *"Qual é o seu nível de conhecimento em tecnologia?"*, com as opções **Muito**, **Médio** e **Pouco**, exibidas como cartões selecionáveis (radio buttons acessíveis por teclado).
- **Envio:** simulado. Não há backend, então os dados não são salvos: o usuário é levado de volta ao login com a mensagem *"Cadastro realizado!"*.

### Validação (estruturada, mas desativada)

Hoje **nada é validado**, mas toda a estrutura já existe em `src/pages/Cadastro/cadastroValidation.ts`:

| Item | Função |
| --- | --- |
| `OPCOES_CONHECIMENTO` | Opções do questionário (valor, título e descrição) |
| `regras` | Regras prontas e reutilizáveis: `obrigatorio`, `email`, `minCaracteres`, `igualA` e `umaDasOpcoes` |
| `regrasCadastro` | Lista de regras de cada campo (**hoje todas vazias**) |
| `validarCadastro(form)` | Executa as regras e retorna o primeiro erro de cada campo |
| `temErros(erros)` | Indica se algum campo tem erro |

A tela já chama `validarCadastro` no envio: se houver erros, o envio é bloqueado, a mensagem aparece abaixo do campo (prop `error` do componente `Input`) e a borda fica vermelha. O erro some quando o usuário edita o campo. Para ativar, basta preencher as listas:

```ts
export const regrasCadastro: Record<CampoCadastro, Regra[]> = {
  nome: [regras.obrigatorio('Informe seu nome.')],
  email: [regras.obrigatorio(), regras.email()],
  usuario: [regras.obrigatorio()],
  senha: [regras.obrigatorio(), regras.minCaracteres(6)],
  confirmarSenha: [regras.igualA('senha', 'As senhas não conferem.')],
  nivelConhecimento: [regras.umaDasOpcoes(OPCOES_CONHECIMENTO.map((o) => o.valor))],
};
```

Uma regra nova é só uma função `(valor, form) => string | undefined` (a mensagem de erro, ou `undefined` se estiver ok).

**Arquivos envolvidos:** `src/pages/Cadastro/` (tela, CSS e validação), `src/types/index.ts` (`CadastroForm`, `NivelConhecimentoTecnologia`), `src/routes/paths.ts` (`ROTAS.cadastro`), `src/routes/AppRoutes.tsx` (rota pública), `src/components/Input/` (prop `error`) e `src/pages/Login/` (link e mensagem de sucesso).
