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

  private ftcAddress: string;
  private ftcEndpoint: string;
  private ftcOperatePk: string;
  private ftcSyncCronTime: string;

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
  }

  onModuleInit() {
    const job = new CronJob(this.ftcSyncCronTime, async () => {
      try {
        await this.syncMerkleTree();
      } catch (err) {
        this.logger.error('failed to sync MerkleTree', err);
      }
    });
    this.schedulerRegistry.addCronJob('sync-merkle-root', job);
    job.start();
  }

  private async syncMerkleTree() {
    await this.updateMerkleTree();
    if (this.merkleTree.getLeafCount() === 0) {
      this.logger.debug(`merkle leaves is 0.`);
      return;
    }
    const root = this.merkleTree.getHexRoot();

    const prevRoot = await this.web3Service.call('merkleRoot', [], {
      endpoint: this.ftcAddress,
      abi: ABIs.FTC,
      address: this.ftcAddress,
    });

    if (root == prevRoot) {
      this.logger.debug(`merkleRoot is not changed`);
      return;
    }

    const receipt = await this.web3Service.send('setMerkleRoot', [root], {
      endpoint: this.ftcEndpoint,
      abi: ABIs.FTC,
      address: this.ftcAddress,
      fromPk: this.ftcOperatePk,
    });

    this.logger.debug(`setMerkleRoot at tx[${receipt.transactionHash}]`);
  }

  private async updateMerkleTree() {
    this.logger.log('[MerkleTree] generating...');
    const metas = await this.metaRepo.find();

    const sceneMetaMap: Record<string, BadgeMeta> = {};
    metas.forEach((meta) => (sceneMetaMap[meta.scene] = meta));

    const reports = await this.reportService.listAll();

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
          encodePacked(
            { type: 'string', value: 'ach' },
            { type: 'address', value: rep.account.toLowerCase() },
            {
              type: 'uint256',
              value: sceneMetaMap[rep.scene].badgeId.toString(),
            },
          ),
        );

        // for claim tokens
        elements.push(
          encodePacked(
            { type: 'string', value: 'aw' },
            { type: 'address', value: rep.account.toLowerCase() },
            {
              type: 'uint256',
              value: sceneMetaMap[rep.scene].badgeId.toString(),
            },
            {
              type: 'uint256',
              value: sceneMetaMap[rep.scene].tokens.toString(),
            },
          ),
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
        };
      });
    return dtos;
  }
}
