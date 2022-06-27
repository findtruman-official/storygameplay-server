import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { SceneMessageService } from './scene-message.service';
import { SceneStoryService } from './scene-story.service';
import { SceneReportService } from './scene-report.service';
import { SceneVisitService } from './scene-visit.service';
import { SceneController } from './scene.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SceneMessage } from './entity/message.entity';
import { SceneReport } from './entity/report.entity';
import { SceneStory } from './entity/story.entity';
import { SceneVisit } from './entity/visit.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    CoreModule,
    TypeOrmModule.forFeature([
      SceneMessage,
      SceneReport,
      SceneStory,
      SceneVisit,
    ]),
  ],
  providers: [
    SceneMessageService,
    SceneStoryService,
    SceneReportService,
    SceneVisitService,
  ],
  controllers: [SceneController],
  exports: [
    SceneMessageService,
    SceneStoryService,
    SceneReportService,
    SceneVisitService,
  ],
})
export class SceneModule {}
