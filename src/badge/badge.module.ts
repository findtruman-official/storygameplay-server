import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from 'src/core/core.module';
import { SceneModule } from 'src/scene/scene.module';
import { BadgeService } from './badge.service';
import { BadgeController } from './badge.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgeMeta } from './entity/badge-meta.entity';
import { BadgeNftController } from './nft.controller';

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    ScheduleModule,
    SceneModule,
    TypeOrmModule.forFeature([BadgeMeta]),
  ],
  providers: [BadgeService],
  controllers: [BadgeController, BadgeNftController],
})
export class BadgeModule {}
