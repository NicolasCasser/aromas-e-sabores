import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppDataSource } from './database/data-source';

@Module({
  imports: [
    // Configuração do banco de dados
    TypeOrmModule.forRoot(AppDataSource.options),
    // Configuração do GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
