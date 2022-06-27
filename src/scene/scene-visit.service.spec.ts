import { Test, TestingModule } from '@nestjs/testing';
import { SceneVisitService } from './scene-visit.service';

describe('SceneVisitService', () => {
  let service: SceneVisitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SceneVisitService],
    }).compile();

    service = module.get<SceneVisitService>(SceneVisitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
