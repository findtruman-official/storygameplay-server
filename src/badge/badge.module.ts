import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from 'src/core/core.module';
import { SceneModule } from 'src/scene/scene.module';
import { BadgeService } from './badge.service';
import { BadgeController } from './badge.controller';

@Module({
  imports: [CoreModule, ScheduleModule, SceneModule],
  providers: [BadgeService],
  controllers: [BadgeController],
})
export class BadgeModule {}
