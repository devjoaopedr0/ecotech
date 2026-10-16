import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string | undefined, page: number, limit: number) {
    const term = q?.trim();
    const where: Prisma.PlantCatalogWhereInput = term
      ? {
          OR: [
            { popularName: { contains: term, mode: 'insensitive' } },
            { scientificName: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.plantCatalog.findMany({
        where,
        orderBy: { popularName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.plantCatalog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.plantCatalog.findUnique({ where: { id } });
  }
}
