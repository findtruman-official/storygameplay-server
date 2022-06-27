import { Test, TestingModule } from '@nestjs/testing';
import { SceneReportService } from './scene-report.service';

describe('SceneReportService', () => {
  let service: SceneReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SceneReportService],
    }).compile();

    service = module.get<SceneReportService>(SceneReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
