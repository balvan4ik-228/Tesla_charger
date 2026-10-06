import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Driver } from './driver.entity';
import { TeslaParameter } from './tesla-parameter.entity';

// Лайки: м-м водитель — параметр. Свой первичный ключ и два внешних.
@Entity('tesla_parameter_likes')
@Unique('uq_tesla_parameter_likes_driver_parameter', ['driver', 'teslaParameter'])
export class TeslaParameterLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Driver, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @ManyToOne(() => TeslaParameter, (parameter) => parameter.likes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tesla_parameter_id' })
  teslaParameter: TeslaParameter;
}
