import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Web3Service } from '../web3/web3.service';
import { validate } from 'class-validator';

export class SigData<D> {
  @ApiProperty()
  timestamp: number;
  @ApiProperty()
  address: string;
  @ApiProperty()
  rawdata: D;
}

export class DataWithSig<D> {
  @ApiProperty()
  data: SigData<D>;

  @ApiProperty()
  sig: string;
}

/**
 * Verify user signature and return DataWithSig,
 * SigData or RawData according to type definition
 */
@Injectable()
export class VerifyEthSignPipe implements PipeTransform {
  private expires: number;

  constructor(private readonly web3Svc: Web3Service, configSvc: ConfigService) {
    this.expires = configSvc.get<number>('WEB3_SIGNATURE_EXPIRES', {
      infer: true,
    });
  }
  async transform(value: any, metadata: ArgumentMetadata) {
    const input: DataWithSig<any> = plainToClass(DataWithSig, value);

    const errors = await validate(input);
    if (errors.length > 0) {
      throw new BadRequestException('invliad DataWithSig<T> structure');
    }

    const recoverAddr = await this.web3Svc.ecRecover(
      JSON.stringify(input.data),
      input.sig,
    );
    if (recoverAddr.toLowerCase() !== input.data.address.toLowerCase()) {
      throw new BadRequestException('invalid DataWithSig<T> signature');
    }

    const currTimesamp = new Date().valueOf();

    if (
      input.data.timestamp + this.expires > currTimesamp ||
      input.data.timestamp > currTimesamp
    ) {
      throw new BadRequestException('invalid timestamp');
    }

    if (metadata.metatype == SigData) {
      return input.data;
    } else if (metadata.metatype == DataWithSig) {
      return input;
    } else {
      return input.data.rawdata;
    }
  }
}
