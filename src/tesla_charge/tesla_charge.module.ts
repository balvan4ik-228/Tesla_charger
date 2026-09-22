import { Module } from '@nestjs/common';
import { TeslaChargeController } from './tesla_charge.controller';
import { TeslaChargeService } from './tesla_charge.service';

@Module({
  controllers: [TeslaChargeController],
  providers: [TeslaChargeService],
})
export class TeslaChargeModule {}
