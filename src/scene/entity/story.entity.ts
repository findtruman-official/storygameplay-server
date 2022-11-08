import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class SceneStory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, length: 64 })
  scene: string;

  @Column({ nullable: false, length: 2048 })
  url: string;

  @Column({ length: 64 })
  account: string;

  @Column({ length: 64 })
  discordTag: string;

  @Column({ length: 64 })
  name: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  case: string;

  @Column({ type: 'text' })
  clueProps: string;

  @Column({ type: 'text' })
  npcDialogue: string;

  @Column({ type: 'text' })
  more: string;

  @Index()
  @Column({ nullable: true, length: 64, default: '' })
  wallet: string;

  @CreateDateColumn()
  createTime: Date;
}
