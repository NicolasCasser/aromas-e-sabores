import { Test, TestingModule } from '@nestjs/testing';
import { StockTransactionResolver } from './stock-transaction.resolver';
import { StockTransactionService } from './stock-transaction.service';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TransactionType } from './enum/transaction-type.enum';
import { StockTransaction } from './entities/stock-transaction.entity';
import { CreateStockTransactionInput } from './dto/create-stock-transaction.input';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockTransactionDTO } from './dto/stock-transaction.dto';

describe('StockTransactionResolver', () => {
  let resolver: StockTransactionResolver;
  
  const mockStockTransactionService = {
    create: jest.fn() as jest.Mock<any>,
    extractByProduct: jest.fn() as jest.Mock<any>, 
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockTransactionResolver,
        {
          provide: StockTransactionService,
          useValue: mockStockTransactionService,
        },
      ],
    }).compile();

    resolver = module.get<StockTransactionResolver>(StockTransactionResolver);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('create', () => {
    it('deve registrar a transação quando os dados de input estiverem corretos', async () => {
      // Arrange
      const input = {
        type: TransactionType.IN,
        quantity: 5,
        productId: '12345',
      } as CreateStockTransactionInput;

      const mockTransaction = {
        id: '12345',
        type: TransactionType.IN,
        quantity: 5,
        productId: '12345',
      } as StockTransaction;

      mockStockTransactionService.create.mockResolvedValue(mockTransaction);

      // Act
      const result = await resolver.createStockTransaction(input);

      // Assert
      expect(mockStockTransactionService.create).toHaveBeenCalledWith(input);
      expect(mockStockTransactionService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTransaction);
    });

    it('deve retornar NotFoundException quando o ID do produto não for encontrado', async () => {
      // Arrange
      const input = {
        type: TransactionType.IN,
        quantity: 5,
        productId: '12345',
      } as CreateStockTransactionInput;

      mockStockTransactionService.create.mockRejectedValue(new NotFoundException('Produto com id 12345 não encontrado'));

      // Assert
      await expect(resolver.createStockTransaction(input)).rejects.toThrow(NotFoundException);
      expect(mockStockTransactionService.create).toHaveBeenCalledTimes(1);
      expect(mockStockTransactionService.create).toHaveBeenCalledWith(input);
    });

    it('deve retornar BadRequestException quando a quantidade na transação for maior que o estoque do produto', async () => {
      // Arrange
      const input = {
        type: TransactionType.OUT,
        quantity: 5,
        productId: '12345',
      } as CreateStockTransactionInput;

      mockStockTransactionService.create.mockRejectedValue(new BadRequestException('Estoque insuficiente.'));

      // Assert
      await expect(resolver.createStockTransaction(input)).rejects.toThrow(BadRequestException);
      expect(mockStockTransactionService.create).toHaveBeenCalledTimes(1);
      expect(mockStockTransactionService.create).toHaveBeenCalledWith(input);
    });
  });

  describe('stockExtractByProduct', () => {
    it('deve retornar o extrato de transações de um produto com sucesso', async () => {
      // Arrange
      const productId = '12345';  
      // Array simulando a lista que o banco retornaria
      const mockTransactions = [
        {
          id: 'transacao-1',
          type: TransactionType.IN,
          quantity: 10,
          productId: productId,
          createdAt: new Date('2026-05-18T10:00:00Z'),
        },
        {
          id: 'transacao-2',
          type: TransactionType.OUT,
          quantity: 2,
          productId: productId,
          createdAt: new Date('2026-05-18T11:00:00Z'),
        } 
      ] as StockTransactionDTO[];

      mockStockTransactionService.extractByProduct.mockResolvedValue(mockTransactions);

      // Act
      const result = await resolver.stockExtractByProduct(productId);
      
      // Assert
      expect(mockStockTransactionService.extractByProduct).toHaveBeenCalledTimes(1);
      expect(mockStockTransactionService.extractByProduct).toHaveBeenCalledWith(productId);
      expect(result).toEqual(mockTransactions); 
    });

    it('deve retornar NotFoundException quando o ID do produto não for encontrado', async () => {
      // Arrange
      const productId = 'id-inexistente';

      mockStockTransactionService.extractByProduct.mockRejectedValue(new NotFoundException());

      // Assert
      await expect(resolver.stockExtractByProduct(productId)).rejects.toThrow(NotFoundException);
      expect(mockStockTransactionService.extractByProduct).toHaveBeenCalledTimes(1);
      expect(mockStockTransactionService.extractByProduct).toHaveBeenCalledWith(productId);
    });
  });
});
