import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { StockTransactionService } from './stock-transaction.service';
import { StockTransaction } from './entities/stock-transaction.entity';
import { CreateStockTransactionInput } from './dto/create-stock-transaction.input';
import { StockTransactionDTO } from './dto/stock-transaction.dto';

@Resolver(() => StockTransaction)
export class StockTransactionResolver {
  constructor(private readonly stockTransactionService: StockTransactionService) {}

  @Mutation(() => StockTransactionDTO)
  async createStockTransaction(@Args('data') data: CreateStockTransactionInput): Promise<StockTransactionDTO> {
    return this.stockTransactionService.create(data);
  }

  @Query(() => [StockTransactionDTO])
  async stockExtractByProduct(@Args('id') id: string): Promise<StockTransactionDTO[]> {
    return await this.stockTransactionService.extractByProduct(id);
  }
}

