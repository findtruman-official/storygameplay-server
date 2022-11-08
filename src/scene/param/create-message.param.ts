import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageParam {
  @ApiProperty()
  account: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  scene: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ nullable: true })
  wallet: string;
}
