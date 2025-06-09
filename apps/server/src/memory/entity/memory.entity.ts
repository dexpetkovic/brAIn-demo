import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity('memory')
export class MemoryEntity {
  @PrimaryGeneratedColumn()
  id!: string

  @CreateDateColumn({ name: 'created_at' })
  public readonly createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  public readonly updatedAt!: Date

  @Column()
  userId!: string

  @Column()
  title!: string

  @Column()
  content!: string

  @Column('text', { array: true })
  tags!: string[]
}
