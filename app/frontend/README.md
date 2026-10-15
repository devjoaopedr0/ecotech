
# 🌿 Ecotech Solutions — Sistema de Irrigação Inteligente

## 📖 Sobre o projeto

O **Ecotech Solutions** é um sistema web para monitorar e controlar a irrigação de uma horta ou jardim de forma inteligente. A ideia é simples: sensores (reais ou simulados) medem a umidade do solo de cada planta, e o sistema mostra esses dados em telas claras, avisa quando alguma planta precisa de atenção e permite ligar/desligar a irrigação — automática ou manualmente.

Este repositório contém **apenas o front-end** (a interface visual e a lógica de tela), construído em **React + TypeScript + Vite**. Hoje os dados de exemplo (plantas, histórico de umidade, leituras) são simulados dentro do próprio projeto, prontos para no futuro serem conectados a uma API real através da variável `VITE_API_URL`.

### Telas do sistema

| Tela | O que faz |
| --- | --- |
| **Login** | Tela de entrada do sistema, com usuário e senha |
| **Visão Geral** | Resumo rápido: saúde da horta, umidade atual, alertas e últimas leituras |
| **Dashboard** | Gráficos, estatísticas e geração de relatório de irrigação (CSV) |
| **Monitor** | Acompanhamento em tempo real de uma planta específica, com controles de irrigação (ligar, desligar, automático, manual) |
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

- **Login**: validação de campos, mostrar/ocultar senha, loading no botão "Entrar", redireciona para a Visão Geral.
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
├── pages/        # Login, VisaoGeral, Dashboard, Monitor, Plantas, Configuracoes
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

