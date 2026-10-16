import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PLANT_CATALOG } from './seed-data/plant-catalog';

/** Carrega o catálogo de plantas. Idempotente: roda de novo sem duplicar e
 * atualiza nome científico e faixa das entradas que já existem. */
async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
  });

  try {
    for (const entry of PLANT_CATALOG) {
      await prisma.plantCatalog.upsert({
        where: { popularName: entry.popularName },
        create: entry,
        update: {
          scientificName: entry.scientificName,
          humidityMin: entry.humidityMin,
          humidityMax: entry.humidityMax,
        },
      });
    }
    console.log(`Catálogo carregado: ${PLANT_CATALOG.length} plantas.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
