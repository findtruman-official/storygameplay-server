import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Logger,
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
  wallet?: string;

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
  private logger = new Logger(VerifyEthSignPipe.name);
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

    const wallet = input.wallet || 'metamask';

    switch (wallet) {
      case 'metamask': {
        try {
          const recoverAddr = await this.web3Svc.ecRecover(
            JSON.stringify(input.data),
            input.sig,
          );
          if (recoverAddr.toLowerCase() !== input.data.address.toLowerCase()) {
            throw new BadRequestException('invalid DataWithSig<T> signature');
          }
        } catch (err) {
          if (err instanceof BadRequestException) {
            throw err;
          } else {
            if (
              !(await this.web3Svc.isValidSeqPolygonSig(
                input.data.address,
                JSON.stringify(input.data),
                input.sig,
              ))
            ) {
              throw new BadRequestException('invalid DataWithSig<T> signature');
            }
          }
        }
        break;
      }
      case 'neoline': {
        this.logger.warn("sign data validater is not ready for 'neoline'");
        break;
      }
      default: {
        this.logger.warn('unknown wallet: ' + wallet);
        break;
      }
    }

    const currTimesamp = new Date().valueOf();

    if (
      input.data.timestamp + this.expires < currTimesamp ||
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
