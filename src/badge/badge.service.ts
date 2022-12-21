import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Web3Service } from 'src/core/web3/web3.service';
import { SceneReportService } from 'src/scene/scene-report.service';
import { Repository } from 'typeorm';
import { encodePacked } from 'web3-utils';
import { BadgeMeta } from './entity/badge-meta.entity';
import MerkleTree from 'merkletreejs';
import keccak256 from 'keccak256';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ConfigService } from '@nestjs/config';
import { ABIs } from 'src/core/web3/abis';
import { BadgeStatusDTO } from './dto/badge-status.dto';
import { SceneReport } from 'src/scene/entity/report.entity';

/**
 * Periodically sync merkle root in FTT and FTB
 */
@Injectable()
export class BadgeService {
  private logger = new Logger(BadgeService.name);
  private merkleTree: MerkleTree;

  private ftaAddress: string;
  private ftaEndpoint: string;

  private ftcAddress: string;
  private ftcEndpoint: string;
  private ftcOperatePk: string;
  private ftcSyncCronTime: string;
  private isSyncingMerkleTree: boolean = false;

  constructor(
    configService: ConfigService,
    private readonly reportService: SceneReportService,
    private readonly web3Service: Web3Service,

    @InjectRepository(BadgeMeta)
    private readonly metaRepo: Repository<BadgeMeta>,

    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.ftcAddress = configService.get('FTC_ADDRESS');
    this.ftcEndpoint = configService.get('FTC_ENDPOINT');
    this.ftcOperatePk = configService.get('FTC_OPERATE_PK');
    this.ftcSyncCronTime = configService.get('FTC_SYNC_CRON_TIME');
    this.ftaAddress = configService.get('FTA_ADDRESS');
    this.ftaEndpoint = configService.get('FTA_ENDPOINT');
  }

  async onModuleInit() {
    const work = async () => {
      try {
        await this.syncMerkleTree();
      } catch (err) {
        this.logger.error('failed to sync MerkleTree', err);
        throw err;
      }
    };
    const job = new CronJob(this.ftcSyncCronTime, work);
    this.schedulerRegistry.addCronJob('sync-merkle-root', job);
    job.start();

    await work();
  }

  private async syncMerkleTree() {
    if (this.isSyncingMerkleTree) return;
    this.isSyncingMerkleTree = true;

    await this.updateMerkleTree();
    if (this.merkleTree.getLeafCount() === 0) {
      this.logger.debug(`merkle leaves is 0.`);
      return;
    }
    const root = this.merkleTree.getHexRoot();

    const prevRoot = await this.web3Service.call('merkleRoot', [], {
      endpoint: this.ftcEndpoint,
      abi: ABIs.FTC,
      address: this.ftcAddress,
    });
    this.logger.debug('prev merkleRoot=' + prevRoot);

    if (root == prevRoot) {
      this.logger.debug(`merkleRoot is not changed`);
      return;
    }
    this.logger.debug('setMerkleRoot ...');
    const receipt = await this.web3Service.send('setMerkleRoot', [root], {
      endpoint: this.ftcEndpoint,
      abi: ABIs.FTC,
      address: this.ftcAddress,
      fromPk: this.ftcOperatePk,
    });

    this.logger.debug(`setMerkleRoot at tx[${receipt.transactionHash}]`);
    this.isSyncingMerkleTree = false;
  }

  private async updateMerkleTree() {
    this.logger.log('[MerkleTree] generating...');
    const metas = await this.metaRepo.find();

    const sceneMetaMap: Record<string, BadgeMeta> = {};
    metas.forEach((meta) => (sceneMetaMap[meta.scene] = meta));

    const reports = await this.reportService.listAll({
      wallets: ['metamask'],
    });

    const reportsHasMeta = reports.filter(
      (rep) => sceneMetaMap[rep.scene] !== undefined,
    );
    this.logger.debug(
      `[MerkleTree] there is ${reportsHasMeta.length} reports with meta in total ${reports.length} reports`,
    );

    const elements: string[] = [];
    reportsHasMeta.forEach((rep) => {
      try {
        // for claim achievement
        elements.push(
          this.encodeClaimAchievementLeaf({
            account: rep.account,
            badgeId: sceneMetaMap[rep.scene].badgeId,
          }),
        );

        // for claim tokens
        elements.push(
          this.encodeClaimTokenLeaf({
            account: rep.account,
            badgeId: sceneMetaMap[rep.scene].badgeId,
            tokens: sceneMetaMap[rep.scene].tokens,
          }),
        );
      } catch (err) {
        this.logger.error('merkle leaf encode failed: ', err);
      }
    });

    this.logger.log(`[MerkleTree] build ${elements.length} leaves`);

    this.merkleTree = new MerkleTree(elements, keccak256, {
      hashLeaves: true,
      sortPairs: true,
    });
  }

  public async listAccountScenesStatus(
    account: string,
    scenes: string[],
  ): Promise<BadgeStatusDTO[]> {
    const reports = await this.reportService.listAccountReports(account);
    const sceneReports: Record<string, SceneReport> = {};
    reports.forEach((rep) => {
      sceneReports[rep.scene] = rep;
    });

    const metas = await this.metaRepo.find();
    const sceneMetas: Record<string, BadgeMeta> = {};
    metas.forEach((meta) => {
      sceneMetas[meta.scene] = meta;
    });

    const dtos: BadgeStatusDTO[] = scenes
      .filter((scene) => {
        const meta = sceneMetas[scene];
        if (!meta) {
          this.logger.error(`there is no BadgeMeta for scene '${scene}'`);
          return false;
        }
        return true;
      })
      .map((scene) => {
        const meta = sceneMetas[scene];
        const report = sceneReports[scene];
        return {
          scene: scene,
          badgeId: meta.badgeId,
          name: meta.name,
          tokens: meta.tokens,
          description: meta.desc,
          image: meta.image,

          claimable: !!report,
          achievementProofs: report
            ? this.merkleTree.getHexProof(
                keccak256(
                  this.encodeClaimAchievementLeaf({
                    account: account,
                    badgeId: meta.badgeId,
                  }),
                ),
              )
            : [],
          tokensProofs: report
            ? this.merkleTree.getHexProof(
                keccak256(
                  this.encodeClaimTokenLeaf({
                    account: account,
                    badgeId: meta.badgeId,
                    tokens: meta.tokens,
                  }),
                ),
              )
            : [],
        };
      });
    return dtos;
  }

  private encodeClaimTokenLeaf(opts: {
    account: string;
    badgeId: number;
    tokens: number;
  }) {
    return encodePacked(
      { type: 'string', value: 'aw' },
      { type: 'address', value: opts.account.toLowerCase() },
      {
        type: 'uint256',
        value: opts.badgeId.toString(),
      },
      {
        type: 'uint256',
        value: opts.tokens.toString() + '000000000000000000',
      },
    );
  }

  private encodeClaimAchievementLeaf(opts: {
    account: string;
    badgeId: number;
  }) {
    return encodePacked(
      { type: 'string', value: 'ach' },
      { type: 'address', value: opts.account.toLowerCase() },
      {
        type: 'uint256',
        value: opts.badgeId.toString(),
      },
    );
    // TO CHECK merkle!!
  }

  public async getNftMeta(tokenId: number | string) {
    const sceneId = (await this.web3Service.call('ftaSceneId', [tokenId], {
      endpoint: this.ftaEndpoint,
      address: this.ftaAddress,
      abi: [
        {
          inputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          name: 'ftaSceneId',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
    })) as number;
    const meta = await this.metaRepo.findOne({ where: { badgeId: sceneId } });
    if (!meta) {
      return null;
    }
    return {
      name: `${meta.name} #${tokenId}`,
      image: meta.image,
      description: meta.desc,
    };
  }
}
