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
import { UnitType } from '../product/enum/unit-type.enum';
import { Product } from '../product/entities/product.entity';

describe('SaleService', () => {
  let service: SaleService;
  let saleRepository: jest.Mocked<Repository<Sale>>;
  let saleItemRepository: jest.Mocked<Repository<SaleItem>>;
  let productService: jest.Mocked<ProductService>;
  let stockTransactionService: jest.Mocked<StockTransactionService>;
  
  let mockTransactionalSaleItemRepo: any;
  let mockEntityManager: any;

  beforeEach(async () => {
    mockTransactionalSaleItemRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockResolvedValue({ id: 'saved-item' }),
    };

    mockEntityManager = {
      getRepository: jest.fn().mockReturnValue(mockTransactionalSaleItemRepo),
    };

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
            manager: {
              transaction: jest.fn().mockImplementation(async (callback) => {
                return await callback(mockEntityManager);
              }),
            },
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
            findByBarcode: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma venda vazia com status OPEN e total zerado', async () => {
      // Arrange
      const mockSale = { status: SaleStatus.OPEN, totalAmount: 0 } as Sale;
      saleRepository.create.mockReturnValue(mockSale);
      saleRepository.save.mockResolvedValue({...mockSale, id: 'sale-id'});

      // Act
      const result = await service.create();

      // Assert
      expect(saleRepository.create).toHaveBeenCalledWith({
        status: SaleStatus.OPEN,
        totalAmount: 0,
      });
      expect(saleRepository.save).toHaveBeenCalledWith(mockSale);
      expect(result.id).toBe('sale-id');
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

  describe('addItemByBarcode', () => {
    it('Deve processar um produto pesado (KG) vindo da balança corretamente', async () => {
      // Arrange
      saleRepository.findOne.mockResolvedValue({ id: 'sale-1' } as any);
      productService.findByBarcode.mockResolvedValue({
        id: 'prod-id',
        barcode: '00045',
        unitType: UnitType.KG,
        price: 1000, // 10 reais em centavos
      } as Product);
      saleItemRepository.create.mockImplementation((dto) => dto as any);
      saleItemRepository.save.mockResolvedValue({ id: 'item-1' } as any);

      // Act
      const etiquetaBalanca = '2000450015509'; // Embutido R$ 15,50
      await service.addItemByBarcode('sale-1', etiquetaBalanca);

      // Assert
      expect(productService.findByBarcode).toHaveBeenCalledWith('00045');
      expect(mockTransactionalSaleItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 1.55,
          subTotal: 1550,
        }),
      );
      expect(stockTransactionService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'prod-id',
          quantity: 1.55,
          type: TransactionType.OUT,
        }),
        mockEntityManager,
      );
    });

    it('Deve processar um produto unitário (UN) de prateleira corretamente', async () => {
      // Arrange
      saleRepository.findOne.mockResolvedValue({ id: 'sale-1' } as any);
      productService.findByBarcode.mockResolvedValue({
        id: 'prod-id',
        barcode: '7891020304050',
        unitType: UnitType.UN,
        price: 2500,
      } as Product);
      saleItemRepository.create.mockImplementation((dto) => dto as any);

      // Act
      const etiquetaFabrica = '7891020304050';
      await service.addItemByBarcode('sale-1', etiquetaFabrica);

      // Assert
      expect(productService.findByBarcode).toHaveBeenCalledWith('7891020304050');
      expect(mockTransactionalSaleItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 1,
          subTotal: 2500,
        }),
      );
    });

    it('Deve realizar fallback para UN se um código de fábrica começar com 2', async () => {
      // Arrange
      saleRepository.findOne.mockResolvedValue({ id: 'sale-1' } as any);
      
      // Simula a primeira tentativa falhando (não acha o código de 5 dígitos '12345')
      // e a segunda tentativa (fallback) encontrando o código inteiro.
      productService.findByBarcode
        .mockResolvedValueOnce(null as any)
        .mockResolvedValueOnce({
          id: 'prod-id',
          barcode: '2123456789012',
          unitType: UnitType.UN,
          price: 5000,
        } as any);
        
      saleItemRepository.create.mockImplementation((dto) => dto as any);

      // Act
      const etiquetaRara = '2123456789012';
      await service.addItemByBarcode('sale-1', etiquetaRara);

      // Assert
      expect(productService.findByBarcode).toHaveBeenCalledWith('12345'); // Tentou fatiar primeiro
      expect(productService.findByBarcode).toHaveBeenCalledWith('2123456789012'); // Fez o fallback
      expect(mockTransactionalSaleItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 1 }),
      );
    });

    it('Deve rejeitar a venda se a etiqueta da balança bater num produto cadastrado como UN', async () => {
      // Arrange
      saleRepository.findOne.mockResolvedValue({ id: 'sale-1' } as any);
      productService.findByBarcode.mockResolvedValue({
        id: 'prod-id',
        barcode: '00045',
        unitType: UnitType.UN, // Erro de cadastro simulado
        price: 10.00,
      } as any);

      // Act & Assert
      const etiquetaBalanca = '2000450015509';
      await expect(service.addItemByBarcode('sale-1', etiquetaBalanca)).rejects.toThrow(BadRequestException);
      await expect(service.addItemByBarcode('sale-1', etiquetaBalanca)).rejects.toThrow(
        'Conflito: Produto lido pela balança está cadastrado como unitário no sistema',
      );
    });
  });

  describe('completeSale', () => {
    it('Deve calcular o totalAmount corretamente somando os centavos e alterar o status', async () => {
      // Assert
      const mockSale = {
        id: 'sale-id',
        status: SaleStatus.OPEN,
        saleItens: [
          { subTotal: 1550 }, // R$ 15,50
          { subTotal: 2500 }, // R$ 25,00
        ],
      } as Sale;

      saleRepository.findOne.mockResolvedValue(mockSale);
      saleRepository.save.mockImplementation((entity) => Promise.resolve(entity as Sale));

      // Act
      const result = await service.completeSale('sale-id', PaymentMethod.PIX);

      expect(result.totalAmount).toBe(4050);
      expect(result.status).toBe(SaleStatus.COMPLETED);
      expect(result.paymentMethod).toBe(PaymentMethod.PIX);
      expect(saleRepository.save).toHaveBeenCalledWith(result);
    });

    it('Deve rejeitar finalizar uma venda sem itens', async () => {
      saleRepository.findOne.mockResolvedValue({
        id: 'sale-id',
        status: SaleStatus.OPEN,
        saleItens: [],
      } as any);

      await expect(service.completeSale('sale-id', PaymentMethod.PIX)).rejects.toThrow(BadRequestException);
    });
  });
});
