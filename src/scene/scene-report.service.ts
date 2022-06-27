import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SceneReport } from './entity/report.entity';
import { CreateReportParam } from './param/create-report.param';

@Injectable()
export class SceneReportService {
  constructor(
    @InjectRepository(SceneReport)
    private readonly reportRepo: Repository<SceneReport>,

    private readonly datasource: DataSource,
  ) {}
  async query(opts: {
    scene: string;
    account: string;
  }): Promise<SceneReport | undefined> {
    return await this.reportRepo.findOne({
      where: {
        scene: opts.scene,
        account: opts.account,
      },
    });
  }

  async create(opts: CreateReportParam): Promise<SceneReport> {
    const obj = await this.datasource.transaction(async (entityManager) => {
      const repo = entityManager.getRepository(SceneReport);
      let obj = await repo.findOne({
        where: { scene: opts.scene, account: opts.account },
        lock: { mode: 'pessimistic_write' },
      });
      if (obj) {
        await repo.delete(obj);
      }
      obj = repo.create({
        ...opts,
      });
      await repo.save(obj);

      return obj;
    });

    return obj;
  }
}
