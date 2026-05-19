import { registerEnumType } from '@nestjs/graphql';

export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  LOSS = 'LOSS',
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
  description: 'Tipos de movimentação de estoque (Entrada, Saída, Perda)',
});
