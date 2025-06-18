import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService], // Export the service if needed in other modules
})
export class AssetModule {}
