import { Module } from '@nestjs/common';
import { TeslaChargeModule } from './tesla_charge/tesla_charge.module';

@Module({
  imports: [TeslaChargeModule],
})
export class AppModule {}
