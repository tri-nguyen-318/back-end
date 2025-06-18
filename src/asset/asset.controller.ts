import { Controller, Get, Query } from '@nestjs/common';
import { Asset, Prisma } from 'generated/prisma';
import { AssetService } from './asset.service';

@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  getAssets(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query() query?: any, // For complex where conditions
  ): Promise<Asset[]> {
    // Parse query parameters
    const params: {
      skip?: number;
      take?: number;
      where?: Prisma.AssetWhereInput;
      orderBy?: Prisma.AssetOrderByWithRelationInput;
    } = {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    };

    // Add simple filtering (extend as needed)
    if (query) {
      const where: Prisma.AssetWhereInput = {};
      if (query.type) where.type = query.type;
      if (query.name) where.name = { contains: query.name };
      params.where = where;
    }

    return this.assetService.getAssets(params);
  }
}
