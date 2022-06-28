import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';

@Injectable()
export class Web3Service {
  private logger = new Logger(Web3Service.name);
  private ecRecoverClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const config = this.configService.get('WEB3_ECRECOVER_NODE');
    const client = new Web3(config.ecRecoverNode);
    this.ecRecoverClient = client;
  }

  async ecRecover(encrypted: string, sig: string): Promise<string> {
    this.logger.debug('ecRecover ' + encrypted + ' ' + sig);
    if (sig.endsWith('00')) {
      sig = sig.slice(0, sig.length - 2) + '1b';
      this.logger.debug('change to ' + sig);
    } else if (sig.endsWith('01')) {
      sig = sig.slice(0, sig.length - 2) + '1c';
      this.logger.debug('change to ' + sig);
    }
    const recoverAddr = await this.ecRecoverClient.eth.personal.ecRecover(
      encrypted,
      sig,
    );
    return recoverAddr.toLowerCase();
  }
}
