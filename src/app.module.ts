import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { SceneModule } from './scene/scene.module';
import { BadgeModule } from './badge/badge.module';

@Module({
  imports: [CoreModule, SceneModule, BadgeModule],
})
export class AppModule {}
