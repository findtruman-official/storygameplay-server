import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PageParam, PageResult } from 'src/core/utils/page';
import { Repository } from 'typeorm';
import { SceneMessage } from './entity/message.entity';
import { CreateMessageParam } from './param/create-message.param';

@Injectable()
export class SceneMessageService {
  constructor(
    @InjectRepository(SceneMessage)
    private readonly messageRepo: Repository<SceneMessage>,
  ) {}

  async list(opts: {
    scene: string;
    page: PageParam;
  }): Promise<PageResult<SceneMessage>> {
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { scene: opts.scene },
      order: { id: 'DESC' },
      skip: opts.page.skip,
      take: opts.page.take,
    });
    return PageResult.from(opts.page, messages, total);
  }

  async create(opts: CreateMessageParam): Promise<SceneMessage> {
    const obj = this.messageRepo.create({ ...opts });
    await this.messageRepo.save(obj);
    return obj;
  }
}
