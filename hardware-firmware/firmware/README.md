# Firmware

Código da placa (ESP32 ou Arduino com Wi-Fi). Ainda não há código nesta pasta.

O backend já implementa o lado da API. Esta página resume o que o firmware precisa fazer; os detalhes estão no [README do backend](../../app/backend/README.md) e no Swagger (`/docs`).

## 1. Cadastrar a placa

Pelo Swagger (o painel ainda não tem tela de cadastro de placas), crie a placa em `POST /devices` e vincule-a a uma planta (`plantId`). A resposta traz um `token` no formato `etk_…`, que **só aparece nessa resposta**. Grave-o no firmware (ou na configuração da placa). Se ele vazar, gere outro em `POST /devices/:id/token`.

## 2. Enviar leituras

A cada leitura (a sugestão é a cada 10–30 s), envie:

```http
POST /readings
X-Device-Token: etk_...
Content-Type: application/json

{ "rawValue": 2240, "temperature": 26.4 }
```

| Campo | Unidade | Observação |
|---|---|---|
| `rawValue` | valor bruto do ADC | Recomendado. O backend converte em % pela calibração da placa (ESP32 0–4095, Arduino 0–1023) |
| `humidity` | % | Alternativa ao `rawValue`, se a conversão for feita na placa. Não envie os dois |
| `temperature` | °C | Temperatura do ar |
| `airHumidity` | % | Umidade relativa do ar |
| `leafTemperature` | °C | Temperatura da folha |
| `light` | lux | Luminosidade |
| `waterLevel` | % | Nível do reservatório |

Todos os campos são opcionais, mas pelo menos um é obrigatório. A umidade do solo só é aceita se a placa estiver vinculada a uma planta.

## 3. Aplicar o comando da resposta

```json
{ "status": "LOW", "irrigation": "ON", "maxRunSec": 1200, "humidity": 41.2, "plantId": "…", "readingId": "…" }
```

- `irrigation`: `ON` liga a bomba e `OFF` desliga. A decisão (modo automático, manual com duração, limites de umidade) é toda do backend.
- `maxRunSec`: com a bomba ligada, desligue sozinho depois desse tempo se não conseguir falar com a API. É a proteção contra perda de Wi-Fi com a bomba ligada.
- A placa fica "offline" no painel se ficar mais de 5 minutos sem enviar leitura.

## 4. Calibrar o sensor de umidade

Meça o valor bruto com o sensor no ar (seco, 0%) e mergulhado na água (100%) e grave em `PUT /devices/:id/calibration` (`{ board, rawDry, rawWet }`), ou pela tela **Sensores → Calibrar** do painel. Sem calibração, o backend usa valores típicos de sensor capacitivo (ESP32: seco 3200, molhado 1300).

## Erros que o firmware deve tratar

| Status | Causa |
|---|---|
| `401` | Token inválido, rotacionado ou placa desativada |
| `400` | Campo fora da faixa, nenhum campo, ou `rawValue` e `humidity` juntos |
| `409` | Umidade do solo enviada por uma placa sem planta vinculada |
| `429` | Limite de requisições por IP. Espere e tente de novo |

> A landing page menciona MQTT, mas a integração implementada hoje é por HTTP. MQTT ainda não existe no backend.
