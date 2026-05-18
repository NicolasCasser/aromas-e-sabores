import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateStockTransactionInput } from './dto/create-stock-transaction.input';
import { InjectRepository } from '@nestjs/typeorm';
import { StockTransaction } from './entities/stock-transaction.entity';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { TransactionType } from './enum/transaction-type.enum';

@Injectable()
export class StockTransactionService {
  constructor(
    @InjectRepository(StockTransaction)
    private readonly repository: Repository<StockTransaction>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(data: CreateStockTransactionInput): Promise<StockTransaction> {
    // Tudo que estiver dentro desse bloco só será salvo no banco de fato se não der nenhum erro
    // Evita que o currentStock de um produto seja alterado sem a stockTransaction ser criada em caso de queda do servidor
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOneBy(Product, { id: data.productId });
  
      if (!product) {
        throw new NotFoundException(`Produto com id ${data.productId} não encontrado`);
      }
  
      if (data.type === TransactionType.IN) {
        product.currentStock += data.quantity;
      } else {
        if (data.quantity > product.currentStock) {
          throw new BadRequestException('Estoque insuficiente.');
        }
        product.currentStock -= data.quantity;
      }

      // Salva o produto atualizado via manager
      await manager.save(product);

      // Cria e salva a movimentação via manager
      const stockTransaction = manager.create(StockTransaction, data);
      return await manager.save(stockTransaction);
    });
  }

  async extractByProduct(id: string): Promise<StockTransaction[]> {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) {
      throw new NotFoundException(`Produto com id ${id} não encontrado`);
    };

    return await this.repository.find({
      where: { productId: id }, // Filtra apenas as transações do produto solicitado
      order: { createdAt: 'DESC' }, // Ordena da data mais recente para a mais antiga
    });
  };
}
