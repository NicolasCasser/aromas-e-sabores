import { Injectable } from '@nestjs/common';
import { CreateSaleInput } from './dto/create-sale.input';
import { UpdateSaleInput } from './dto/update-sale.input';

@Injectable()
export class SaleService {
  create(createSaleInput: CreateSaleInput) {
    return 'This action adds a new sale';
  }

  findAll() {
    return `This action returns all sale`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sale`;
  }

  update(id: number, updateSaleInput: UpdateSaleInput) {
    return `This action updates a #${id} sale`;
  }

  remove(id: number) {
    return `This action removes a #${id} sale`;
  }
}
