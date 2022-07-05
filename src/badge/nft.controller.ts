import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ResponseData,
  TransformInterceptor,
} from 'src/core/interceptor/transform.interceptor';
import { BadgeService } from './badge.service';
import { BadgeStatusDTO } from './dto/badge-status.dto';

@Controller('nft')
@UseInterceptors(TransformInterceptor)
@ApiTags('Badge')
@ApiExtraModels(ResponseData, BadgeStatusDTO)
export class BadgeNftController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get('fta/:tokenId')
  @ApiResponse({
    status: 200,
  })
  async getMeta(@Param('tokenId') tokenId: number) {
    return await this.badgeService.getNftMeta(tokenId);
  }
}
