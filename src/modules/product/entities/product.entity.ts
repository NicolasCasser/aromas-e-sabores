import { BaseEntity } from 'src/modules/bases/entities/base.entity';
import { Column, Entity } from 'typeorm';
import { UnitType } from '../enum/unit-type.enum';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  barcode?: string;

  @Column({ name: 'unit_type', type: 'simple-enum', enum: UnitType, nullable: false})
  unitType!: UnitType;

  @Column({ type: 'int', nullable: false })
  price!: number;

  @Column({ name: 'current_stock', type: 'int', nullable: false })
  currentStock!: number;
}
