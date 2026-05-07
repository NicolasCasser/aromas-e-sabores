import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductDTO } from './dto/product.dto';

@Resolver(() => ProductDTO)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => ProductDTO)
  async createProduct(@Args('data') data: CreateProductInput): Promise<ProductDTO> {
    return await this.productService.create(data);
  }

  @Query(() => [ProductDTO])
  async findAll(): Promise<ProductDTO[]> {
    return await this.productService.findAll();
  }

  @Query(() => ProductDTO)
  async findById(@Args('id') id: string): Promise<ProductDTO> {
    return await this.productService.findById(id);
  }

  @Query(() => ProductDTO)
  async findByBarcode(@Args('barcode') barcode: string): Promise<ProductDTO> {
    return await this.productService.findByBarcode(barcode);
  }

  @Mutation(() => ProductDTO)
  updateProduct(
    @Args('id') id: string,
    @Args('updateProductInput') updateProductInput: UpdateProductInput
  ) {
    return this.productService.update(id, updateProductInput);
  }

  @Mutation(() => ProductDTO)
  removeProduct(@Args('id', { type: () => Int }) id: number) {
    return this.productService.remove(id);
  }
}
