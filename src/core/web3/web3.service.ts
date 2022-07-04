import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { ContractSendMethod } from 'web3-eth-contract';
import { TransactionReceipt } from 'web3-core';
@Injectable()
export class Web3Service {
  private logger = new Logger(Web3Service.name);
  private ecRecoverClient;

  // {endpoint: client}
  private clients: Record<string, Web3> = {};

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

  getCachedClient(endpoint: string): Web3 {
    if (this.clients[endpoint] === undefined) {
      this.clients[endpoint] = new Web3(endpoint);
    }
    return this.clients[endpoint];
  }

  async call<Args extends any[], R>(
    method: string,
    args: Args,
    opts: {
      endpoint: string;
      abi: AbiItem[];
      address: string;
    },
  ): Promise<R> {
    const client = this.getCachedClient(opts.endpoint);
    const contract = new client.eth.Contract(opts.abi, opts.address);
    const result = await contract.methods[method](...args).call();
    return result;
  }

  async send<Args extends any[]>(
    method: string,
    args: Args,
    opts: {
      endpoint: string;
      abi: AbiItem[];
      address: string;
      fromPk: string;
    },
  ): Promise<TransactionReceipt> {
    const client = this.getCachedClient(opts.endpoint);

    const contract = new client.eth.Contract(opts.abi, opts.address);

    const { address } = client.eth.accounts.wallet.add(opts.fromPk);

    const receipt: TransactionReceipt = await contract.methods[method](
      ...args,
    ).send({ from: address, gas: 2000000 });

    return receipt;
  }
}
