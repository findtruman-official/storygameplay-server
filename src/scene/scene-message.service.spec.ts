import { Test, TestingModule } from '@nestjs/testing';
import { SceneMessageService } from './scene-message.service';

describe('SceneMessageService', () => {
  let service: SceneMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SceneMessageService],
    }).compile();

    service = module.get<SceneMessageService>(SceneMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
