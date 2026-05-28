import { Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleResolver } from './sale.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { ProductModule } from '../product/product.module';
import { StockTransactionModule } from '../stock-transaction/stock-transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem]),
    ProductModule,
    StockTransactionModule,
  ],
  providers: [SaleResolver, SaleService],
})
export class SaleModule {}
