import { Module } from '@nestjs/common';
import { StockTransactionService } from './stock-transaction.service';
import { StockTransactionResolver } from './stock-transaction.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockTransaction } from './entities/stock-transaction.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockTransaction,
      Product,
    ]),
  ],
  providers: [StockTransactionResolver, StockTransactionService],
})
export class StockTransactionModule {}
