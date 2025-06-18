import { Injectable } from '@nestjs/common';
import { Asset, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a single asset
  createAsset(data: Prisma.AssetCreateInput): Promise<Asset> {
    return this.prisma.asset.create({
      data,
    });
  }

  // Create multiple assets (bulk insert)
  createAssets(
    assets: Prisma.AssetCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.asset.createMany({
      data: assets,
      skipDuplicates: true, // Optional: skip duplicates
    });
  }

  // Get all assets with optional pagination
  getAssets(params: {
    skip?: number;
    take?: number;
    where?: Prisma.AssetWhereInput;
    orderBy?: Prisma.AssetOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.asset.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }
}
