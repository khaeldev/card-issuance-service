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

  // REGLA DE NEGOCIO: UNIQUE Constraint para evitar duplicados por cliente
  @Column({ unique: true })
  @Index()
  documentNumber: string;

  @Column()
  fullName: string;

  @Column({ type: 'varchar', default: CardStatus.PENDING })
  status: string;

  @Column({ nullable: true })
  cardNumber: string; // En un caso real, esto debería estar tokenizado/hasheado

  @Column({ nullable: true })
  cvv: string; // Solo para demo. NO guardar CVV en producción real.

  @Column({ nullable: true })
  expirationDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
