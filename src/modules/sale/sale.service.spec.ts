import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SaleService } from './sale.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { ProductService } from '../product/product.service';
import { StockTransactionService } from '../stock-transaction/stock-transaction.service';
import { PaymentMethod } from './enum/payment-methods.enum';
import { TransactionType } from '../stock-transaction/enum/transaction-type.enum';
import { SaleStatus } from './enum/sale-status.enum';

describe('SaleService', () => {
  let service: SaleService;

  let saleRepository: jest.Mocked<Repository<Sale>>;
  let saleItemRepository: jest.Mocked<Repository<SaleItem>>;
  let productService: jest.Mocked<ProductService>;
  let stockTransactionService: jest.Mocked<StockTransactionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleService,
        {
          provide: getRepositoryToken(Sale),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOneOrFail: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ProductService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: StockTransactionService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SaleService>(SaleService);

    saleRepository = module.get(getRepositoryToken(Sale));
    saleItemRepository = module.get(getRepositoryToken(SaleItem));
    productService = module.get(ProductService);
    stockTransactionService = module.get(StockTransactionService);

    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve lançar BadRequestException se o carrinho de compras estiver vazio', async () => {
      // Arrange
      const input = { paymentMethod: PaymentMethod.PIX, items: [] };

      // Act & Assert
      await expect(service.create(input)).rejects.toThrow(BadRequestException);
      await expect(service.create(input)).rejects.toThrow(
        'A venda precisa ter pelo menos um item',
      );
    });

    it('deve lançar BadRequestException se a quantidade pedida for maior que o estoque atual', async () => {
      // Arrange
      const input = {
        paymentMethod: PaymentMethod.PIX,
        items: [{ productId: 'prod-1', quantity: 10 }],
      };

      productService.findById.mockResolvedValue({
        id: 'prod-1',
        name: 'Milho',
        price: 500,
        currentStock: 5, // Estoque insuficiente
      } as any);

      // Act & Assert
      await expect(service.create(input)).rejects.toThrow(BadRequestException);
      await expect(service.create(input)).rejects.toThrow(
        'Estoque insuficiente para o produto: Milho',
      );
    });

    it('deve criar uma venda com sucesso, salvar os itens e registrar a saída no estoque', async () => {
      // Arrange
      const input = {
        paymentMethod: PaymentMethod.PIX,
        items: [{ productId: 'prod-1', quantity: 2 }],
      };

      const mockProduct = {
        id: 'prod-1',
        name: 'Milho',
        price: 500,
        currentStock: 10,
      };
      const mockSavedSale = {
        id: 'sale-1',
        totalAmount: 1000,
        paymentMethod: PaymentMethod.PIX,
      };

      productService.findById.mockResolvedValue(mockProduct as any);
      saleRepository.create.mockReturnValue(mockSavedSale as any);
      saleRepository.save.mockResolvedValue(mockSavedSale as any);
      saleItemRepository.create.mockReturnValue({} as any);
      saleItemRepository.save.mockResolvedValue({} as any);
      saleRepository.findOneOrFail.mockResolvedValue({
        ...mockSavedSale,
        saleItens: [],
      } as any);

      // Act
      const result = await service.create(input);

      // Assert
      expect(result).toBeDefined();
      expect(saleRepository.save).toHaveBeenCalledWith(mockSavedSale);
      expect(stockTransactionService.create).toHaveBeenCalledWith({
        productId: 'prod-1',
        quantity: 2,
        type: TransactionType.OUT,
      });
    });
  });

  describe('cancel', () => {
    it('deve lançar NotFoundException se a venda não existir', async () => {
      // Arrange
      saleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancel('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancel('id-invalido')).rejects.toThrow(
        'Venda não encontrada',
      );
    });

    it('deve lançar BadRequestException se a venda já estiver cancelada', async () => {
      // Arrange
      saleRepository.findOne.mockResolvedValue({
        id: 'venda-123',
        status: SaleStatus.CANCELED,
      } as any);

      // Act & Assert
      await expect(service.cancel('venda-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel('venda-123')).rejects.toThrow(
        'A venda com id venda-123 já está cancelada',
      );
    });

    it('deve cancelar a venda e gerar transações de entrada no estoque para cada item', async () => {
      // Arrange
      const mockSale = {
        id: 'venda-123',
        status: SaleStatus.COMPLETED,
        saleItens: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 5 },
        ],
      };

      saleRepository.findOne.mockResolvedValue(mockSale as any);
      saleRepository.save.mockResolvedValue(mockSale as any);
      stockTransactionService.create.mockResolvedValue({} as any);

      // Act
      const result = await service.cancel('venda-123');

      // Assert
      expect(result.status).toBe(SaleStatus.CANCELED);
      expect(saleRepository.save).toHaveBeenCalledWith(mockSale);

      expect(stockTransactionService.create).toHaveBeenCalledTimes(2);
      expect(stockTransactionService.create).toHaveBeenNthCalledWith(1, {
        type: TransactionType.IN,
        quantity: 2,
        productId: 'prod-1',
      });
      expect(stockTransactionService.create).toHaveBeenNthCalledWith(2, {
        type: TransactionType.IN,
        quantity: 5,
        productId: 'prod-2',
      });
    });
  });
});
