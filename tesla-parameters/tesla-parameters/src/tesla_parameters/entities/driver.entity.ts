import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Пользователь системы — водитель Tesla Model S
@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  login: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ name: 'is_moderator', type: 'boolean', default: false })
  isModerator: boolean;
}
