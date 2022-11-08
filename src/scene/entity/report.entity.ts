import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class SceneReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, length: 64 })
  scene: string;

  @Column({ nullable: false, length: 2048 })
  url: string;

  @Column({ nullable: false, default: 'en' })
  lang: string;

  @Column({ nullable: false, length: 64 })
  discordTag: string;

  @Column({ nullable: false, length: 64 })
  account: string;

  @Column({ type: 'text', nullable: false })
  answer: string;

  @Column({ type: 'text', nullable: false })
  reason: string;

  @Column({ nullable: false, length: 100, default: '' })
  community: string;

  @Index()
  @Column({ nullable: true, length: 64, default: '' })
  wallet: string;

  @CreateDateColumn()
  createTime: Date;
}
