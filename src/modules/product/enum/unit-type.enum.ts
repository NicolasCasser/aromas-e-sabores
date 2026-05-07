import { registerEnumType } from "@nestjs/graphql";

export enum UnitType {
    KG = 'kg',
    UN = 'un',
}

registerEnumType(UnitType, {
    name: 'UnitType',
    description: 'Define os padrões de unidades dos produtos: kg (kilos) ou un (unidade)',
});