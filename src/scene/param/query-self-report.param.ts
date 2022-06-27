import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class QuerySelfReportParam {
  @ApiProperty()
  @IsString()
  scene: string;
  @ApiProperty()
  @IsString()
  account: string;
}
