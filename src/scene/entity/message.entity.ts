import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class SceneMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, length: 64 })
  scene: string;

  @Column({ nullable: false, length: 2048 })
  url: string;

  @Column({ nullable: false, length: 64 })
  account: string;

  @Column({ nullable: false, length: 800 })
  message: string;

  @Index()
  @Column({ nullable: true, length: 64, default: '' })
  wallet: string;

  @CreateDateColumn()
  createTime: Date;
}
