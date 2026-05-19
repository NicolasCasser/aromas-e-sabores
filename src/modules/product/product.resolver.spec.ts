import { Test, TestingModule } from '@nestjs/testing';
import { ProductResolver } from './product.resolver';
import { ProductService } from './product.service';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UnitType } from './enum/unit-type.enum';
import { CreateProductInput } from './dto/create-product.input';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProductResolver', () => {
  let resolver: ProductResolver;

  const mockProductService = {
    create: jest.fn() as jest.Mock<any>,
    findAll: jest.fn() as jest.Mock<any>,
    findById: jest.fn() as jest.Mock<any>,
    findByBarcode: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
    remove: jest.fn() as jest.Mock<any>,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductResolver,
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    resolver = module.get<ProductResolver>(ProductResolver);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createProduct', () => {
    it('deve repassar os dados para o service e retornar o produto criado', async () => {
      // Arrange
      const input = {
        name: 'Produto Teste',
        price: 8.5,
        unitType: UnitType.KG,
      } as CreateProductInput;

      const expectedProduct = { id: 'uuid-gerado', ...input };

      // Faz com que o service false retorne o expectedProduct quando rodar o método create
      mockProductService.create.mockResolvedValue(expectedProduct);

      // Act
      const result = await resolver.createProduct(input);

      // Assert
      // Testa se o resolver chamou o service.create passando o input corretamente
      expect(mockProductService.create).toHaveBeenCalledWith(input);
      // Testa se o resolver devolveu exatamente o que service mandou
      expect(result).toEqual(expectedProduct);
    });

    it('deve repassar o erro se o service lançar uma exceção (ex: ConflictException)', async () => {
      // Arrange
      const input = {
        name: 'Produto Duplicado',
        barcode: '12345',
      } as CreateProductInput;

      // Erro que o Service vai lançar
      const error = new ConflictException(
        'O código de barras 12345 já está cadastrado',
      );

      mockProductService.create.mockRejectedValue(error);

      // Act
      await expect(resolver.createProduct(input)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('deve retornar o produto corretamente quando o ID for passado', async () => {
      // Arrange
      const id = '12345';
      const mockProduct = { id: '12345', name: 'Produto teste ' };

      mockProductService.findById.mockResolvedValue(mockProduct);

      // Act
      const result = await resolver.findById(id);

      // Assert
      expect(mockProductService.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockProduct);
    });

    it('deve retornar NotFoundException quando o produto com o ID passado não for encontrado', async () => {
      // Arrange
      const id = 'id-inexistente';
      mockProductService.findById.mockRejectedValue(new NotFoundException());

      // Assert
      await expect(resolver.findById(id)).rejects.toThrow(NotFoundException);
    });

    it('deve retornar NotFoundException quando o produto com o código de barras passado não for encontrado', async () => {
      // Arrange
      const barcode = 'barcode-inexistente';
      mockProductService.findByBarcode.mockRejectedValue(
        new NotFoundException(),
      );

      // Assert
      await expect(resolver.findByBarcode(barcode)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('Deve retornar um array de produtos', async () => {
      // Arrange
      const mockProducts = [
        { id: '1', name: 'Produto 1' },
        { id: '2', name: 'Produto 2' },
        { id: '3', name: 'Produto 3' },
      ];

      mockProductService.findAll.mockResolvedValue(mockProducts);

      // Act
      const result = await resolver.findAll();

      // Assert
      expect(mockProductService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });

  describe('updateProduct', () => {
    it('deve atualizar o produto corretamente quando um ID correto for passado', async () => {
      // Arrange
      // O que o front-end envia
      const id = '12345';
      const input = { name: 'Produto atualizado' };
      // O que service retornaria após salvar no banco
      const updatedProduct = { id: '12345', name: 'Produto atualizado' };

      // Diz para o mock de service retornar o updateProduct quando o método update for chamado (usando mockResolvedValue porque o Service é async)
      mockProductService.update.mockResolvedValue(updatedProduct);

      // Act
      const result = await resolver.updateProduct(id, input);

      // Assert
      expect(mockProductService.update).toHaveBeenCalledWith(id, input);
      expect(result).toEqual(updatedProduct);
    });

    it('deve retornar NotFoundException quando o ID não for encontrado', async () => {
      // Arrange
      const id = '12345';
      const input = { name: 'produto' };
      mockProductService.update.mockRejectedValue(new NotFoundException());

      // Assert
      await expect(resolver.updateProduct(id, input)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeProduct', () => {
    it('deve remover um produto quando um ID existente for passado', async () => {
      // Arrange
      const mockProduct = {
        id: '12345',
        name: 'Produto teste',
      };
      const id = '12345';

      mockProductService.remove.mockResolvedValue(mockProduct);

      // Act
      const result = await resolver.removeProduct(id);

      // Assert
      expect(mockProductService.remove).toHaveBeenCalledTimes(1);
      expect(mockProductService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockProduct);
    });

    it('deve retornar NotFoundException quando o ID não for encontrado', async () => {
      // Arrange
      const id = '12345';
      mockProductService.remove.mockRejectedValue(new NotFoundException());

      // Assert
      await expect(resolver.removeProduct(id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductService.remove).toHaveBeenCalledTimes(1);
    });
  });
});
