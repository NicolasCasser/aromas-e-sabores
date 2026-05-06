import { DataSource } from "typeorm";

export const AppDataSource = new DataSource ({
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: false,
    logging: true,
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/database/migrations/*{.ts,.js}'],
})