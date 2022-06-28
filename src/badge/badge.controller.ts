import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ResponseData,
  TransformInterceptor,
} from 'src/core/interceptor/transform.interceptor';
import { schemaWithResponseData } from 'src/core/utils/schema';
import { BadgeService } from './badge.service';
import { BadgeStatusDTO } from './dto/badge-status.dto';

@Controller('badges')
@UseInterceptors(TransformInterceptor)
@ApiTags('Badge')
@ApiExtraModels(ResponseData, BadgeStatusDTO)
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get('status')
  @ApiQuery({ name: 'scenes', description: 'sceneId concatenate with commas' })
  @ApiResponse({
    status: 200,
    schema: schemaWithResponseData({ model: BadgeStatusDTO, isArray: true }),
  })
  async getBadgeStatus(
    @Query('account') account: string,
    @Query('scenes') scenes: string,
  ) {
    const sceneIds = scenes
      .split(',')
      .map((scene) => scene.trim())
      .filter((scene) => !!scene);
    return await this.badgeService.listAccountScenesStatus(account, sceneIds);
  }
}
