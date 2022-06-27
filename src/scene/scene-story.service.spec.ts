import { Test, TestingModule } from '@nestjs/testing';
import { SceneStoryService } from './scene-story.service';

describe('SceneStoryService', () => {
  let service: SceneStoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SceneStoryService],
    }).compile();

    service = module.get<SceneStoryService>(SceneStoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
