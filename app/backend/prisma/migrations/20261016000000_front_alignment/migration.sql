-- Alinha o banco às funcionalidades do frontend: limites de umidade em cinco
-- níveis, culturas, canteiro e plantio, placas com calibração e várias
-- grandezas por leitura, irrigação com duração/motivo/litros e alertas novos.
-- Gerado com `prisma migrate diff` e ajustado à mão para preservar os dados
-- (renomeia colunas e preenche as novas a partir das antigas).

-- CreateEnum
CREATE TYPE "SensorBoard" AS ENUM ('ARDUINO', 'ESP32');

-- AlterEnum (PostgreSQL 12+ aceita vários ADD VALUE na mesma migration,
-- desde que os valores novos não sejam usados nela)
ALTER TYPE "AlertType" ADD VALUE 'CRITICAL';
ALTER TYPE "AlertType" ADD VALUE 'RESERVOIR_LOW';
ALTER TYPE "AlertType" ADD VALUE 'HIGH_TEMPERATURE';
ALTER TYPE "AlertType" ADD VALUE 'WATER_STRESS';

-- Plants: a faixa antiga (humidity_min/max) vira a faixa ideal; os limites
-- novos seguem a mesma regra de `deriveThresholds` em src/domain/humidity.ts.
ALTER TABLE "plants" RENAME COLUMN "humidity_min" TO "ideal_min";
ALTER TABLE "plants" RENAME COLUMN "humidity_max" TO "ideal_max";
ALTER TABLE "plants"
ADD COLUMN "bed" TEXT,
ADD COLUMN "crop_id" UUID,
ADD COLUMN "planted_at" DATE,
ADD COLUMN "humidity_low" INTEGER,
ADD COLUMN "humidity_high" INTEGER,
ADD COLUMN "humidity_critical" INTEGER;
UPDATE "plants" SET
  "humidity_low" = GREATEST("ideal_min" - 5, 1),
  "humidity_high" = LEAST("ideal_max" + 10, 100);
UPDATE "plants" SET "humidity_critical" = GREATEST("humidity_low" - 5, 0);
ALTER TABLE "plants"
ALTER COLUMN "humidity_low" SET NOT NULL,
ALTER COLUMN "humidity_high" SET NOT NULL,
ALTER COLUMN "humidity_critical" SET NOT NULL;

-- AlterTable
ALTER TABLE "devices" ADD COLUMN "board" "SensorBoard" NOT NULL DEFAULT 'ESP32',
ADD COLUMN "depth_cm" INTEGER,
ADD COLUMN "position" TEXT,
ADD COLUMN "raw_dry" INTEGER,
ADD COLUMN "raw_wet" INTEGER;

-- AlterTable
ALTER TABLE "readings" ADD COLUMN "air_humidity" DECIMAL(5,2),
ADD COLUMN "leaf_temperature" DECIMAL(4,1),
ADD COLUMN "light" INTEGER,
ADD COLUMN "raw_value" INTEGER,
ADD COLUMN "temperature" DECIMAL(4,1),
ADD COLUMN "water_level" DECIMAL(5,2),
ALTER COLUMN "plant_id" DROP NOT NULL,
ALTER COLUMN "humidity" DROP NOT NULL;

-- AlterTable
ALTER TABLE "irrigation_settings" ADD COLUMN "auto_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "flow_rate_lpm" DECIMAL(5,2) NOT NULL DEFAULT 2;

-- AlterTable: ciclos antigos ganham o motivo genérico de acordo com a origem.
ALTER TABLE "irrigation_events" ADD COLUMN "humidity_after" DECIMAL(5,2),
ADD COLUMN "humidity_before" DECIMAL(5,2),
ADD COLUMN "liters" DECIMAL(8,2),
ADD COLUMN "planned_duration_min" INTEGER,
ADD COLUMN "reason" TEXT;
UPDATE "irrigation_events" SET "reason" = CASE WHEN "source" = 'AUTO' THEN 'Umidade abaixo do nível crítico.' ELSE 'Acionamento manual.' END;
ALTER TABLE "irrigation_events" ALTER COLUMN "reason" SET NOT NULL;

-- AlterTable: o valor do alerta deixa de ser só umidade.
ALTER TABLE "alerts" RENAME COLUMN "humidity" TO "value";
ALTER TABLE "alerts" ALTER COLUMN "value" TYPE DECIMAL(6,2),
ADD COLUMN "device_id" UUID,
ALTER COLUMN "plant_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "crops" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "temperature_min" DECIMAL(4,1) NOT NULL,
    "temperature_max" DECIMAL(4,1) NOT NULL,
    "light_min" INTEGER NOT NULL,
    "light_max" INTEGER NOT NULL,
    "irrigations_per_day" DECIMAL(4,2) NOT NULL,
    "cycle_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crops_user_id_name_key" ON "crops"("user_id", "name");

-- CreateIndex
CREATE INDEX "readings_device_id_created_at_idx" ON "readings"("device_id", "created_at");

-- AddForeignKey
ALTER TABLE "crops" ADD CONSTRAINT "crops_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
