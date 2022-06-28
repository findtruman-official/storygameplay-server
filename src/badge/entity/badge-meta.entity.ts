import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
export class BadgeMeta {
  @PrimaryColumn({ length: 64 })
  scene: string;

  @Index({ unique: true })
  @Column({ comment: 'means contract ftaSceneId' })
  badgeId: number;

  @Column({ comment: 'tokens to award' })
  tokens: number;

  @Column({ length: 128 })
  name: string;

  @Column({ type: 'text' })
  desc: string;

  @Column({ length: 2048 })
  image: string;
}
