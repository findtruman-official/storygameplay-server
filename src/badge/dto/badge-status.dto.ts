import { ApiProperty } from '@nestjs/swagger';

export class BadgeStatusDTO {
  @ApiProperty()
  scene: string;

  @ApiProperty()
  badgeId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  tokens: number;

  @ApiProperty()
  claimable: boolean;

  @ApiProperty()
  achievementProofs: string[];

  @ApiProperty()
  tokensProofs: string[];
}
