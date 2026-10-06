import { DataSource } from 'typeorm';
import { Driver } from '../src/tesla_parameters/entities/driver.entity';
import { TeslaParameter } from '../src/tesla_parameters/entities/tesla-parameter.entity';
import { TeslaParameterLike } from '../src/tesla_parameters/entities/tesla-parameter-like.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [Driver, TeslaParameter, TeslaParameterLike],
  synchronize: true,
});

async function run() {
  await dataSource.initialize();
  await dataSource.synchronize();
  console.log('Миграции выполнены успешно.');
  await dataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error('Ошибка миграций:', err);
  process.exit(1);
});
