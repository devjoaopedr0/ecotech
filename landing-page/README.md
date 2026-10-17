# Landing page

Site de apresentação do EcoTech, publicado em **https://irrigaai.vercel.app**. Foi importado de [ecotech-template](https://github.com/devjoaopedr0/ecotech-template).

É um site estático em HTML, CSS e JavaScript puros, sem build nem dependências.

## Como ver localmente

Abra `index.html` no navegador. Se preferir um servidor local (para os caminhos relativos funcionarem como em produção):

```bash
npx serve .
```

## Estrutura

```
landing-page/
├── index.html        # página única, com todas as seções
├── css/              # um arquivo por seção (header, hero, pillars, impact…) + global.css
├── js/
│   ├── nav.js        # menu e navegação
│   └── animations.js # animações ao rolar
├── imgs/             # logo e favicon
└── DOCUMENTACAO.md   # visão geral do produto (hardware, modos de irrigação, MQTT)
```

## Deploy

O site é publicado na Vercel como site estático. Não há `vercel.json` nem passo de build no repositório: a configuração do projeto fica no painel da Vercel.

## Observações

- O [`DOCUMENTACAO.md`](DOCUMENTACAO.md) descreve a comunicação por MQTT e um painel em React com JavaScript. A implementação atual é diferente: a placa fala com a API por HTTP (veja o [README do firmware](../hardware-firmware/firmware/README.md)) e o painel é em React com TypeScript (`app/frontend`).
- Licença MIT (ver [`LICENSE`](LICENSE)).
