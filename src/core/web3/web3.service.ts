import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { TransactionReceipt } from 'web3-core';
import { BytesLike, ethers } from 'ethers';
import { encodeMessageDigest } from '@0xsequence/utils';
@Injectable()
export class Web3Service {
  private logger = new Logger(Web3Service.name);
  private ecRecoverClient;

  // {endpoint: client}
  private clients: Record<string, Web3> = {};
  private sequencePolygonClient: Web3;
  private sequencePolygonEIP12721MagicValue = '0x1626ba7e';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const ecRecoverNode = this.configService.get('WEB3_ECRECOVER_NODE');
    const client = new Web3(ecRecoverNode);
    this.ecRecoverClient = client;

    this.sequencePolygonClient = new Web3(
      this.configService.get('WEB3_SEQUENCE_POLYGON_NODE'),
    );
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

  async isValidSeqPolygonSig(
    address: string,
    data: string,
    sig: string,
  ): Promise<boolean> {
    const digest = ethers.utils.hexlify(this.encodeHash(data));
    const instance = new this.sequencePolygonClient.eth.Contract(
      eip1271Abi,
      address,
    );
    const result = await instance.methods.isValidSignature(digest, sig).call();
    return result === this.sequencePolygonEIP12721MagicValue;
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
    const prevGasPrice = await client.eth.getGasPrice();
    const gasPrice = parseInt(prevGasPrice) + 1000000000;

    const receipt: TransactionReceipt = await contract.methods[method](
      ...args,
    ).send({ from: address, gas: 2000000, gasPrice });

    return receipt;
  }

  // EIP 1271

  messageToBytes(message: BytesLike) {
    if (ethers.utils.isBytes(message) || ethers.utils.isHexString(message)) {
      return ethers.utils.arrayify(message);
    }

    return ethers.utils.toUtf8Bytes(message);
  }
  prefixEIP191Message(message: BytesLike) {
    const eip191prefix = ethers.utils.toUtf8Bytes(
      '\x19Ethereum Signed Message:\n',
    );
    const messageBytes = this.messageToBytes(message);
    return ethers.utils.concat([
      eip191prefix,
      ethers.utils.toUtf8Bytes(String(messageBytes.length)),
      messageBytes,
    ]);
  }

  encodeHash(message: string) {
    const prefixed = this.prefixEIP191Message(message);
    const digest = encodeMessageDigest(prefixed);
    return digest;
  }
}

const eip1271Abi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_hash',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: '_signature',
        type: 'bytes',
      },
    ],
    name: 'isValidSignature',
    outputs: [
      {
        internalType: 'bytes4',
        name: 'magicValue',
        type: 'bytes4',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as AbiItem[];
