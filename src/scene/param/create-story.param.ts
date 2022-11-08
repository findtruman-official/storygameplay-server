import { ApiProperty } from '@nestjs/swagger';

export class CreateStoryParam {
  @ApiProperty()
  account: string;

  @ApiProperty()
  scene: string;

  @ApiProperty()
  case: string;

  @ApiProperty()
  clueProps: string;

  @ApiProperty()
  discordTag: string;

  @ApiProperty()
  more: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  npcDialogue: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ nullable: true })
  wallet: string;
}
