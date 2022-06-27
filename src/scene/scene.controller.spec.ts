import { Test, TestingModule } from '@nestjs/testing';
import { SceneController } from './scene.controller';

describe('SceneController', () => {
  let controller: SceneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SceneController],
    }).compile();

    controller = module.get<SceneController>(SceneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
