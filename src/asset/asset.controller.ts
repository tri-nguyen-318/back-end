import {
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
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

  @Post('/analyze')
  async analyzeAssets() {
    // This method can be used to trigger analysis of assets
    // For now, it just returns all assets
    const result = await this.assetService.analyzeAssets();
    console.log('🚀 ~ AssetController ~ analyzeAssets ~ result:', result);

    if (!result) {
      throw new NotFoundException('No assets found for analysis');
    }

    return {
      message: 'Assets analyzed successfully',
      assets: result,
      foundAt: 123456789, // Example timestamp
    };
  }
}
