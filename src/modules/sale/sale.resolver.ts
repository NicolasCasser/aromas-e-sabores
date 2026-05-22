import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { SaleService } from './sale.service';
import { Sale } from './entities/sale.entity';
import { CreateSaleInput } from './dto/create-sale.input';
import { UpdateSaleInput } from './dto/update-sale.input';

@Resolver(() => Sale)
export class SaleResolver {
  constructor(private readonly saleService: SaleService) {}

  @Mutation(() => Sale)
  createSale(@Args('createSaleInput') createSaleInput: CreateSaleInput) {
    return this.saleService.create(createSaleInput);
  }

  @Query(() => [Sale], { name: 'sale' })
  findAll() {
    return this.saleService.findAll();
  }

  @Query(() => Sale, { name: 'sale' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.saleService.findOne(id);
  }

  @Mutation(() => Sale)
  updateSale(@Args('updateSaleInput') updateSaleInput: UpdateSaleInput) {
    return this.saleService.update(updateSaleInput.id, updateSaleInput);
  }

  @Mutation(() => Sale)
  removeSale(@Args('id', { type: () => Int }) id: number) {
    return this.saleService.remove(id);
  }
}
