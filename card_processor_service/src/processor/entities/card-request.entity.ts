import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CardStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  FAILED = 'FAILED',
}

@Entity('cards_db')
export class CardRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentType: string;

  @Column({ unique: true })
  @Index()
  documentNumber: string;

  @Column()
  fullName: string;

  @Column({ type: 'varchar', default: CardStatus.PENDING })
  status: string;

  @Column({ nullable: true })
  cardNumber: string;

  @Column({ nullable: true })
  cvv: string;

  @Column({ nullable: true })
  expirationDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
