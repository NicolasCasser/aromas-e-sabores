import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleResolver } from './sale.resolver';

@Module({
  providers: [SaleResolver, SaleService],
})
export class SaleModule {}
