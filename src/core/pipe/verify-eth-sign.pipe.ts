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
import Secp256k1 from 'secp256k1';
import { sha256 } from 'js-sha256';

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

  async verifyPlugSign(inputs: DataWithSig<any>) {
    // build message
    function formatMessage(rawMessage: string) {
      const encoder = new TextEncoder();
      const message = encoder.encode(rawMessage);
      const hash = sha256.create();
      hash.update(message);
      return hash.digest();
    }
    const { sig, rawKey } = JSON.parse(inputs.sig);

    const result = Secp256k1.ecdsaVerify(
      new Uint8Array(Buffer.from(sig, 'hex')),
      new Uint8Array(formatMessage(JSON.stringify(inputs.data))),
      new Uint8Array(Buffer.from(rawKey, 'hex')),
    );
    return result;
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
      case 'plug': {
        try {
          if (!this.verifyPlugSign(input)) {
            throw new BadRequestException('invalid DataWithSig<T> signature');
          }
        } catch (err) {
          this.logger.warn('plug verify failed: ' + err.message);
        }
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
