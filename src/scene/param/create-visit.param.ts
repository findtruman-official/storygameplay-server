import { ApiProperty } from '@nestjs/swagger';

export class CreateVisitParam {
  @ApiProperty()
  scene: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  account: string;

  @ApiProperty({ nullable: true })
  wallet: string;
}
