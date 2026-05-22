import { registerEnumType } from "@nestjs/graphql";

export enum PaymentMethod {
    PIX = 'PIX',
    CREDIT_CARD = 'CREDIT_CARD',
    MONEY = 'MONEY',
}

registerEnumType(PaymentMethod, {
    name: 'PaymentMethod',
    description: 'Define os métodos de pagamento aceitos pelo sistema',
});