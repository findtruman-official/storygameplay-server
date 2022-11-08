import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ResponseData,
  TransformInterceptor,
} from 'src/core/interceptor/transform.interceptor';
import {
  DataWithSig,
  SigData,
  VerifyEthSignPipe,
} from 'src/core/pipe/verify-eth-sign.pipe';
import { PageParam, PageResult } from 'src/core/utils/page';
import {
  schemaWithEthSig,
  schemaWithPageResult,
  schemaWithResponseData,
} from 'src/core/utils/schema';

import { SceneMessage } from './entity/message.entity';
import { SceneStory } from './entity/story.entity';
import { SceneReport } from './entity/report.entity';
import { CreateMessageParam } from './param/create-message.param';
import { CreateStoryParam } from './param/create-story.param';
import { CreateReportParam } from './param/create-report.param';
import { CreateVisitParam } from './param/create-visit.param';
import { QuerySelfReportParam } from './param/query-self-report.param';
import { SceneMessageService } from './scene-message.service';
import { SceneReportService } from './scene-report.service';
import { SceneStoryService } from './scene-story.service';
import { SceneVisitService } from './scene-visit.service';

@Controller('scenes')
@UseInterceptors(TransformInterceptor)
@ApiTags('Scene')
@ApiExtraModels(
  ResponseData,
  PageResult,
  DataWithSig,
  SigData,

  SceneReport,
  SceneMessage,
  SceneStory,

  CreateReportParam,
  CreateMessageParam,
  CreateStoryParam,
  CreateVisitParam,
  QuerySelfReportParam,
)
export class SceneController {
  constructor(
    private readonly storyService: SceneStoryService,
    private readonly messageService: SceneMessageService,
    private readonly visitService: SceneVisitService,
    private readonly reportService: SceneReportService,
  ) {}

  @Post('reports')
  @ApiOperation({ summary: '提交解谜' })
  @ApiBody({ schema: schemaWithEthSig({ model: CreateReportParam }) })
  @ApiResponse({
    status: 200,
    schema: schemaWithResponseData({ model: SceneReport }),
  })
  async createReport(
    @Body(VerifyEthSignPipe)
    { address, rawdata }: SigData<CreateReportParam>,
  ): Promise<SceneReport> {
    return await this.reportService.create({
      ...rawdata,
      account: address,
    });
  }

  @Post('reports/self')
  @ApiOperation({ summary: '查看我已提交的解谜, 不存在则返回null' })
  @ApiBody({ schema: schemaWithEthSig({ model: QuerySelfReportParam }) })
  @ApiResponse({
    status: 200,
    schema: schemaWithResponseData({ model: SceneReport }),
  })
  async querySelfReport(
    @Body(VerifyEthSignPipe)
    { address, rawdata }: SigData<QuerySelfReportParam>,
  ): Promise<SceneReport | undefined> {
    return (
      (await this.reportService.query({
        scene: rawdata.scene,
        account: address,
      })) || null
    );
  }

  @Post('messages')
  @ApiOperation({ summary: '提交留言' })
  @ApiBody({ schema: schemaWithEthSig({ model: CreateMessageParam }) })
  @ApiResponse({
    status: 200,
    schema: schemaWithResponseData({ model: SceneMessage }),
  })
  async createMessage(
    @Body(VerifyEthSignPipe)
    body: SigData<CreateMessageParam>,
  ): Promise<SceneMessage> {
    return await this.messageService.create({
      ...body.rawdata,
    });
  }

  @Get('messages')
  @ApiOperation({ summary: '查看留言' })
  @ApiResponse({
    status: 200,
    schema: schemaWithResponseData({
      schema: schemaWithPageResult({ model: SceneMessage }),
    }),
  })
  async queryMessages(
    @Query('scene') scene: string,
    @Query('page', new DefaultValuePipe('1'), ParseIntPipe) page: number,
    @Query('size', new DefaultValuePipe('10'), ParseIntPipe) size: number,
    @Query(
      'wallets',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    wallets?: string[],
  ): Promise<PageResult<SceneMessage>> {
    return await this.messageService.list({
      scene,
      page: new PageParam({ page, size }),
      wallets,
    });
  }

  @Post('stories')
  @ApiOperation({ summary: '提交故事' })
  @ApiBody({ schema: schemaWithEthSig({ model: CreateStoryParam }) })
  @ApiResponse({
    status: 200,
    schema: schemaWithResponseData({ model: SceneStory }),
  })
  async createStory(
    @Body(VerifyEthSignPipe)
    body: SigData<CreateStoryParam>,
  ): Promise<SceneStory> {
    return await this.storyService.create({
      ...body.rawdata,
      account: body.address,
    });
  }

  @Get('stories')
  @ApiOperation({ summary: '查看我提交的故事' })
  @ApiResponse({
    status: 200,
    schema: schemaWithResponseData({ model: SceneStory }),
  })
  async queryStory(
    @Query('account') account: string,
    @Query('scene') scene: string,
  ): Promise<SceneStory | undefined> {
    return (await this.storyService.query({ scene, account })) || null;
  }

  @Post('visits')
  @ApiOperation({ summary: '访问记录' })
  async creatVist(@Body(ValidationPipe) body: CreateVisitParam) {
    return await this.visitService.create(body);
  }
}
