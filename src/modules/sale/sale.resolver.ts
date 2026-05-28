import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { SaleService } from './sale.service';
import { Sale } from './entities/sale.entity';
import { CreateSaleInput } from './dto/create-sale.input';
import { SaleDTO } from './dto/sale.dto';

@Resolver(() => Sale)
export class SaleResolver {
  constructor(private readonly saleService: SaleService) {}

  @Mutation(() => SaleDTO)
  async createSale(@Args('data') data: CreateSaleInput): Promise<SaleDTO> {
    return this.saleService.create(data);
  }

  @Query(() => [SaleDTO])
  async findAllSales(): Promise<SaleDTO[]> {
    return await this.saleService.findAll();
  }
}
