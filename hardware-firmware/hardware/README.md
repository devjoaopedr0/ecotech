# Hardware

Esquemáticos, layout de PCB e lista de componentes (BOM). Ainda não há arquivos nesta pasta.

## Montagem planejada

Conforme a documentação da landing page ([`landing-page/DOCUMENTACAO.md`](../../landing-page/DOCUMENTACAO.md)):

| Componente | Pino do ESP32 | Observação |
|---|---|---|
| Sensor capacitivo de umidade do solo | GPIO 34 | Entrada analógica (ADC de 12 bits, 0–4095) |
| Sensor de temperatura DHT22 | GPIO 4 | Um fio de dados |
| Módulo relé 5 V, 1 canal (IN) | GPIO 26 | Ativo em nível baixo: LOW liga a bomba |
| Mini bomba d'água 5 V submersível | — | Alimentada pela fonte, nunca direto pelo ESP32 |
| Fonte 5 V / 2 A | — | Alimenta a bomba e o ESP32 |
| VCC dos sensores | 3,3 V | — |

O backend também aceita, de forma opcional, umidade do ar, temperatura da folha, luminosidade (lux) e nível do reservatório (%). Veja o [README do firmware](../firmware/README.md).

## Ao adicionar arquivos

- Coloque os arquivos-fonte (KiCad, EasyEDA ou outro) e exporte também um PDF do esquemático, para quem não tem a ferramenta.
- Mantenha a BOM em CSV, com quantidade, referência, valor e um link de compra.
- Atualize a tabela acima se algum pino mudar. O firmware depende dela.
