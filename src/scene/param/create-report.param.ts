import { ApiProperty } from '@nestjs/swagger';

export class CreateReportParam {
  @ApiProperty()
  account: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  scene: string;

  @ApiProperty()
  lang: string;

  @ApiProperty()
  answer: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  discordTag: string;

  @ApiProperty()
  community: string;

  @ApiProperty({ nullable: true })
  wallet: string;
}
