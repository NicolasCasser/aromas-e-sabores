import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { UnitType } from './enum/unit-type.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';

describe('ProductService', () => {
  let service: ProductService;

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve salvar um produto com sucesso', async () => {
      // Arrange
      const input = {
        name: 'Produto teste',
        price: 100,
        unitType: UnitType.UN,
        currentStock: 10,
      };

      mockProductRepository.create.mockReturnValue(input);
      mockProductRepository.save.mockResolvedValue({
        id: 'uuid-do-produto',
        ...input,
      });

      // Act
      const result = await service.create(input);

      // Assert
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Produto teste',
          currentStock: 10,
        }),
      );
      expect(result.id).toBe('uuid-do-produto');
    });

    it('não deve permitir a criação de um produto com um código de barras já existente no sistema', async () => {
      // Arrange
      const input = {
        name: 'Produto duplicado',
        barcode: '12345',
      } as CreateProductInput;

      // Simula que o banco achou um produto com o mesmo código de barras
      mockProductRepository.findOneBy.mockResolvedValue({
        id: 'uuid-do-produto',
        barcode: '12345',
      });

      // Assert
      // Garante que o service trata e lança o erro de conflito
      await expect(service.create(input)).rejects.toThrow(ConflictException);
      // Garante que a aplicação não tentou salvar o dado sujo no banco
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar o produto quando o ID existir', async () => {
      // Arrange
      const mockProduct = { id: 'id-do-produto', name: 'Produto 1' };
      // Simula que o findOneBy do repositório encontrou o produto
      mockProductRepository.findOneBy.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findById('id-do-produto');

      // Assert
      // Confirma que o repository tentou buscar o produto com o id 'id-do-produto'
      expect(mockProductRepository.findOneBy).toHaveBeenLastCalledWith({
        id: 'id-do-produto',
      });
      // Confirma que o método retornou o produto esperado.
      expect(result).toEqual(mockProduct);
    });

    it('deve retornar NotFoundException quando o ID não for encontrado', async () => {
      // Arrange
      // Simula que o banco não encontrou nada
      mockProductRepository.findOneBy.mockResolvedValue(null);

      // Assert
      await expect(service.findById('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar o produto quando o ID existir', async () => {
      // Arrange
      const mockProduct = { id: 'id-do-produto', name: 'Produto 1' };
      mockProductRepository.findOneBy.mockResolvedValue(mockProduct);

      // Simula o que o banco devolve após salvar
      const updatedProduct = { id: 'id-do-produto', name: 'Produto 2' };
      mockProductRepository.save.mockResolvedValue(updatedProduct);

      // Act
      const input = { name: 'Produto 2' };
      const result = await service.update('id-do-produto', input);

      // Assert
      // Garante que ele buscou o produto certo no banco p
      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({
        id: 'id-do-produto',
      });
      // Garante que enviou os dados mesclados corretos para salvar
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'id-do-produto',
          name: 'Produto 2',
        }),
      );
      // Garante que a função repassou a resposta do banco para frente
      expect(result).toEqual(updatedProduct);
    });

    it('deve lançar NotFoundException ao tentar atualizar um ID inexistente', async () => {
      // Arrange
      // Simula que a busca inicial no banco não encontrou nada
      mockProductRepository.findOneBy.mockResolvedValue(null);

      const input = { name: 'Produto' };

      // Assert
      await expect(service.update('id-inexistente', input)).rejects.toThrow(
        NotFoundException,
      );
      // Garante que a aplicação parou na linha de erro e nunca chamou o save
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deve excluir o produto quando o ID existir', async () => {
      // Arrange
      const mockProduct = { id: 'id-do-produto', name: 'Produto 1' };
      mockProductRepository.findOneBy.mockResolvedValue(mockProduct);

      // Act
      await service.remove('id-do-produto');

      // Assert
      expect(mockProductRepository.findOneBy).toHaveBeenLastCalledWith({
        id: 'id-do-produto',
      });
      expect(mockProductRepository.softRemove).toHaveBeenCalledWith(
        mockProduct,
      );
    });

    it('deve lançar NotFoundException ao tentar excluir um ID inexistente', async () => {
      // Arrange
      mockProductRepository.findOneBy.mockResolvedValue(null);

      // Assert
      await expect(service.remove('id-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductRepository.softRemove).not.toHaveBeenCalled();
    });
  });
});
