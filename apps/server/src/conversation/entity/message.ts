import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('message')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'text' })
  sender!: string

  @Column({ name: 'user_id', type: 'text' })
  userId!: string

  @Column({ name: 'received_at', type: 'timestamp' })
  receivedAt!: Date

  @Column({ name: 'message', type: 'text' })
  message!: string

  @Column({ name: 'message_stub_type', type: 'text' })
  messageStubType!: string

  @Column({ name: 'message_stub_parameters', type: 'jsonb' })
  messageStubParameters!: string[]
}
