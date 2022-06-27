import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneVisit } from './entity/visit.entity';
import { CreateVisitParam } from './param/create-visit.param';

@Injectable()
export class SceneVisitService {
  constructor(
    @InjectRepository(SceneVisit)
    private readonly visitRepo: Repository<SceneVisit>,
  ) {}

  async create(opts: CreateVisitParam): Promise<SceneVisit> {
    const obj = this.visitRepo.create(opts);
    return await this.visitRepo.save(obj);
  }
}
