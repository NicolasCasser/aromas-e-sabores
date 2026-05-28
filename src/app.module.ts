import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppDataSource } from './database/data-source';
import { ProductModule } from './modules/product/product.module';
import { StockTransactionModule } from './modules/stock-transaction/stock-transaction.module';
import { SaleModule } from './modules/sale/sale.module';

@Module({
  imports: [
    // Configuração do banco de dados
    TypeOrmModule.forRoot(AppDataSource.options),
    // Configuração do GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    ProductModule,
    StockTransactionModule,
    SaleModule,
  ],
})
export class AppModule {}
