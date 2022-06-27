import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SceneStory } from './entity/story.entity';
import { CreateStoryParam } from './param/create-story.param';

@Injectable()
export class SceneStoryService {
  constructor(
    @InjectRepository(SceneStory)
    private readonly storyRepo: Repository<SceneStory>,

    private readonly datasource: DataSource,
  ) {}

  async query(opts: {
    account: string;
    scene: string;
  }): Promise<SceneStory | undefined> {
    return await this.storyRepo.findOne({
      where: {
        account: opts.account,
        scene: opts.scene,
      },
    });
  }

  async create(opts: CreateStoryParam): Promise<SceneStory> {
    return await this.datasource.transaction(async (entityManager) => {
      const repo = entityManager.getRepository(SceneStory);
      let obj = await repo.findOne({
        where: { scene: opts.scene, account: opts.account },
        lock: { mode: 'pessimistic_write' },
      });
      if (obj) {
        await repo.delete(obj);
      }
      await repo.save(repo.create(opts));
      return obj;
    });
  }
}
