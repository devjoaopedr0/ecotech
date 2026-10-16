import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CatalogService } from './catalog.service';

export class CatalogQueryDto {
  @ApiPropertyOptional({ description: 'Busca no nome popular e no científico (mínimo 2 letras).' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'q deve ter pelo menos 2 caracteres.' })
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

@ApiTags('catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Catálogo de plantas com faixa ideal de umidade (autocomplete).' })
  search(@Query() query: CatalogQueryDto) {
    return this.catalogService.search(query.q, query.page ?? 1, query.limit ?? 20);
  }
}
