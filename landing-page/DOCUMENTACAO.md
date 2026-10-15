# Ecotech — Documentação

Sistema inteligente de irrigação para hortas domésticas com ESP32, sensores, painel em React com JavaScript e comunicação MQTT.

---

## O que é

O Ecotech monitora a umidade e temperatura do solo em tempo real e aciona automaticamente uma bomba d'água quando necessário. A comunicação utiliza MQTT para a troca de leituras e comandos, e o painel web em React com JavaScript permite acompanhar e controlar a irrigação.

---

## Tecnologias utilizadas

| Tecnologia | Papel no projeto |
|------------|------------------|
| ESP32 | Leitura dos sensores e controle da bomba por meio do relé. |
| React | Interface do painel de monitoramento e controle. |
| JavaScript | Lógica da interface e atualização dos dados exibidos. |
| MQTT | Comunicação por publicação e assinatura de mensagens entre os dispositivos e a plataforma. |
| HTML e CSS | Estrutura e apresentação visual das interfaces web. |

---

## Hardware necessário

- ESP32 (DevKit v1) — microcontrolador com Wi-Fi
- Sensor capacitivo de umidade do solo (GPIO 34)
- Sensor de temperatura DHT22 (GPIO 4)
- Módulo relé 5V 1-canal (GPIO 26)
- Mini bomba d'água 5V DC submersível
- Fonte 5V 2A

---

## Conexões

| Componente       | Pino ESP32 | Observação                        |
|------------------|------------|-----------------------------------|
| Sensor umidade   | GPIO 34    | ADC — leitura analógica 0–100%    |
| DHT22            | GPIO 4     | Protocolo 1-Wire                  |
| Relé (IN)        | GPIO 26    | LOW = bomba ligada (ativo-baixo)  |
| VCC sensores     | 3.3V       | —                                 |
| Bomba            | Fonte 5V   | Não ligar direto no ESP32         |

---

## Como funciona

1. ESP32 lê umidade e temperatura a cada 5 segundos.
2. Se umidade < 30%, a bomba é ligada. Se > 70%, é desligada.
3. As leituras são publicadas via MQTT e distribuídas por um broker, que encaminha as mensagens aos componentes inscritos nos tópicos correspondentes.
4. O painel em React com JavaScript apresenta os dados recebidos pela plataforma em tempo real no navegador.

---

## Modos de irrigação

- **Automático** — ESP32 decide com base nos limites de umidade configurados.
- **Manual** — usuário solicita o acionamento pelo painel; a plataforma envia o comando ao dispositivo via MQTT.

---

## Comunicação MQTT

O MQTT organiza a comunicação em tópicos. Os componentes publicam mensagens ou assinam os tópicos cujas atualizações precisam receber.

| Fluxo | Finalidade |
|-------|------------|
| Dispositivo → plataforma | Envio das leituras dos sensores para monitoramento. |
| Plataforma → dispositivo | Envio dos comandos de irrigação solicitados pelo usuário. |

Os nomes dos tópicos, os formatos das mensagens e a configuração do broker devem ser consultados na implementação atual da plataforma e do firmware.

---

## Sobre este repositório

Este repositório contém o site de apresentação do Ecotech, desenvolvido em HTML, CSS e JavaScript. O painel React e a implementação da comunicação MQTT não estão incluídos aqui.

Para visualizar o site, abra `index.html` no navegador. A execução do painel e a conexão MQTT dependem das instruções e configurações dos respectivos projetos.

---

## Estrutura do projeto

```
Ecotech/
├── index.html          # Landing page
├── DOCUMENTACAO.md     # Este arquivo
├── css/                # Estilos por seção
├── js/                 # Scripts (nav, animações)
└── imgs/               # Logo e favicon
```

---

## Impacto esperado

- Redução de até 40% no consumo de água comparado à irrigação manual.
- Solo mantido na faixa ideal de umidade, sem excesso nem ressecamento.
- Sistema autônomo 24h, sem necessidade de intervenção.
- Custo total de hardware abaixo de R$ 80.

---

© 2025 Ecotech — Projeto Acadêmico de Pesquisa
