# Dashboard Avançada

## Visão geral

A Dashboard Avançada é o nível de visualização destinado ao usuário que possui maior familiaridade com tecnologia e deseja ter mais controle sobre os dados da horta.

Nesse nível, o sistema apresenta informações mais completas sobre sensores, plantas, irrigação, histórico, tendências e monitoramento, permitindo uma análise mais detalhada do funcionamento da horta.

A proposta é oferecer **mais informações e controle sem perder a organização visual do sistema**.

---

## Objetivo

A Dashboard Avançada foi desenvolvida para permitir que o usuário acompanhe os dados da horta com maior profundidade.

Entre os principais objetivos estão:

- visualizar os dados dos sensores;
- acompanhar o estado das plantas;
- monitorar a umidade;
- acompanhar a irrigação;
- analisar informações históricas;
- comparar períodos;
- identificar tendências;
- verificar limites dos dados;
- diagnosticar sensores;
- consultar relatórios;
- acompanhar o sistema de forma mais detalhada.

---

## Estrutura da Dashboard

A Dashboard Avançada é organizada em diferentes áreas, cada uma com uma função específica no monitoramento da horta.

### Visão Geral

A Visão Geral apresenta um resumo completo da situação atual da horta.

Nessa área o usuário consegue visualizar os principais indicadores e informações de monitoramento em um único local.

---

### Monitor

A área de Monitoramento permite acompanhar os dados coletados pelo sistema.

Ela concentra informações relacionadas aos sensores e às condições atuais da horta, facilitando o acompanhamento dos dados durante a utilização do sistema.

---

### Plantas

A área de Plantas apresenta as informações relacionadas às culturas cadastradas.

O usuário consegue acompanhar as plantas e visualizar informações relacionadas ao seu monitoramento.

Também são utilizados componentes específicos para apresentar informações das culturas e imagens das plantas.

---

### Sensores

A seção de Sensores permite visualizar os dispositivos responsáveis pela coleta dos dados ambientais.

Nessa área são disponibilizadas informações relacionadas aos sensores e ao seu funcionamento.

A Dashboard Avançada também possui recursos específicos para calibração e acompanhamento dos sensores.

---

## Diagnóstico dos Sensores

O sistema possui um componente específico para diagnóstico dos sensores.

Esse recurso permite analisar informações relacionadas ao funcionamento dos dispositivos e identificar situações que podem exigir atenção.

O diagnóstico complementa o monitoramento ao apresentar informações mais técnicas para o usuário avançado.

---

## Limites e Tendências

A Dashboard Avançada possui uma área destinada ao acompanhamento de limites e tendências.

Esse recurso permite observar o comportamento dos dados e identificar variações ao longo do tempo.

A análise de tendências pode ajudar o usuário a perceber mudanças nas condições da horta e tomar decisões com base nas informações apresentadas pelo sistema.

---

## Comparação de Períodos

A Dashboard Avançada também possui o recurso de comparação de períodos.

Essa funcionalidade permite analisar os dados considerando diferentes períodos de tempo, facilitando a identificação de mudanças e comportamentos diferentes na horta.

A comparação pode ser utilizada para analisar a evolução dos dados de monitoramento e auxiliar na tomada de decisões.

---

## Umidade

A umidade é um dos principais dados utilizados no monitoramento da horta.

A Dashboard Avançada permite acompanhar esse indicador com maior nível de detalhamento, incluindo sua relação com os limites e tendências identificados pelo sistema.

Quando os valores atingem uma situação que exige atenção, o sistema utiliza a indicação de **umidade crítica** para facilitar a identificação do problema.

---

## Irrigação

A área de irrigação permite acompanhar informações relacionadas ao controle e ao funcionamento da irrigação da horta.

Os dados de monitoramento podem ser utilizados como apoio para as decisões relacionadas à necessidade de irrigação.

Dessa forma, o usuário consegue relacionar as condições observadas pelos sensores com as ações realizadas no sistema.

---

## Relatórios

A Dashboard Avançada possui uma área específica para relatórios.

Os relatórios permitem organizar e consultar informações relacionadas ao monitoramento da horta, facilitando a análise dos dados registrados pelo sistema.

---

## Watch

A Dashboard Avançada também possui uma área denominada Watch, destinada ao acompanhamento das informações em uma interface adaptada para esse tipo de utilização.

O recurso amplia as possibilidades de acompanhamento dos dados da Ecotech.

---

# Componentes utilizados

A Dashboard Avançada utiliza componentes próprios e componentes compartilhados entre diferentes áreas do sistema.

Entre eles estão:

- Header;
- Sidebar;
- Cards;
- Botões;
- Status Badge;
- Alertas;
- Tabelas;
- Gráficos;
- Modais;
- Ícones;
- Componentes de monitoramento;
- Componentes de sensores;
- Componentes de plantas.

Essa organização permite manter um padrão visual entre as diferentes partes da aplicação.

---

# Organização do código

A estrutura da Dashboard Avançada é organizada por componentes, páginas e utilitários.

As páginas principais ficam separadas de acordo com suas funcionalidades, enquanto os componentes reutilizáveis ficam organizados em suas respectivas pastas.

Entre as áreas presentes na estrutura estão:

```text
src/
├── avancado/
│   ├── components/
│   ├── pages/
│   └── utils/
│
├── compartilhado/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   └── utils/
│
└── routes/
```

A separação facilita a manutenção e a evolução da dashboard.

---

# Dados e integração

A Dashboard Avançada utiliza a estrutura compartilhada de dados da aplicação.

A camada de API possui elementos para comunicação, definição de endpoints, tipos e dados utilizados pelo frontend.

Entre os recursos relacionados estão:

- cliente da API;
- endpoints;
- tipos de dados;
- dados mockados;
- funções de tratamento;
- dados de sensores;
- dados de umidade;
- informações de irrigação.

Essa estrutura permite que o frontend seja preparado para trabalhar com os dados provenientes da plataforma Ecotech.

---

# Navegação

A navegação da Dashboard Avançada é integrada ao sistema de rotas da aplicação.

O usuário pode acessar as diferentes áreas da dashboard por meio da estrutura de navegação, mantendo uma experiência consistente durante a utilização do sistema.

As rotas também fazem parte do controle dos diferentes níveis de visualização da Ecotech.

---

# Responsividade

A Dashboard Avançada foi estruturada para funcionar em diferentes tamanhos de tela.

A interface utiliza componentes e estilos responsivos para adaptar a apresentação das informações conforme o dispositivo utilizado.

O objetivo é manter a utilização da dashboard sem comprometer a organização das informações.

---

# Nível de visualização

A Dashboard Avançada corresponde ao **Nível 3** da Ecotech Solutions.

Esse nível é destinado ao usuário que deseja ter maior controle e acesso a uma quantidade maior de informações.

### Nível 1 — Iniciante

Experiência mais simples, com:

- resumos visuais;
- informações diretas;
- alertas objetivos.

### Nível 2 — Intermediário

Apresenta mais informações e recursos para usuários que possuem alguma familiaridade com tecnologia, incluindo:

- gráficos;
- histórico;
- indicadores;
- acompanhamento das condições da horta.

### Nível 3 — Avançado

Apresenta a maior quantidade de informações e recursos do sistema, incluindo:

- telemetria;
- dados detalhados;
- histórico;
- tendências;
- diagnóstico;
- comparação de períodos;
- sensores;
- relatórios;
- monitoramento mais completo.

A principal diferença da Dashboard Avançada para a Intermediária está no **nível de profundidade e controle oferecido ao usuário**.

---

# Tecnologias

A Dashboard Avançada faz parte do frontend da Ecotech Solutions e utiliza tecnologias como:

- React;
- TypeScript;
- Vite;
- CSS;
- HTML;
- JavaScript.

A aplicação utiliza uma estrutura baseada em componentes, páginas, layouts, contextos, hooks, rotas e utilitários.

---

# Evolução da Dashboard

A estrutura atual da Dashboard Avançada foi organizada para permitir futuras evoluções do sistema.

A dashboard pode receber novos recursos conforme a evolução da Ecotech Solutions, incluindo novas integrações, dados de sensores e funcionalidades de monitoramento.

A organização atual do frontend permite adicionar novas funcionalidades mantendo a estrutura existente e a identidade visual da aplicação.

---

# Conclusão

A Dashboard Avançada reúne os principais recursos de monitoramento da Ecotech Solutions em uma experiência voltada para usuários que precisam de mais informações e controle.

Ela amplia a visualização dos dados em relação aos níveis anteriores e reúne recursos como monitoramento, sensores, plantas, irrigação, tendências, comparação de períodos, diagnóstico e relatórios.

Seu objetivo é oferecer uma experiência mais completa para análise da horta, mantendo a organização, responsividade e identidade visual do sistema.