import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>
  ) {}

  async create(data: CreateProductInput): Promise<Product> {
    // Garante que o código de barras é único
    if (data.barcode) {
      const existingProduct = await this.repository.findOneBy({ barcode: data.barcode});

      if (existingProduct) {
        throw new ConflictException(`O código de barras ${data.barcode} já está cadastrado em outro produto.`);
      }
    }
    
    const product = this.repository.create(data);
    return await this.repository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.repository.find();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.repository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Produto com id ${id} não encontrado.`);
    }

    return product;
  }

  async findByBarcode(barcode: string): Promise<Product> {
    const product = await this.repository.findOneBy({ barcode });

    if (!product) {
      throw new NotFoundException(`Produto com código ${barcode} não encontrado.`);
    }

    return product;
  }

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    const product = await this.repository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Produto com id ${id} não encontrado.`);
    }

    Object.assign(product, data);
    return this.repository.save(product);
  }

  async remove(id: string): Promise<Product> {
    const product = await this.repository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Produto com id ${id} não encontrado.`);
    }

    return await this.repository.softRemove(product);
  }
}
