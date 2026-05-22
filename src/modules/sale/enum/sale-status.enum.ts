import { registerEnumType } from "@nestjs/graphql";

export enum SaleStatus {
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED',
};

registerEnumType(SaleStatus, {
    name: 'SaleStatus',
    description: 'Status de vendas',
});