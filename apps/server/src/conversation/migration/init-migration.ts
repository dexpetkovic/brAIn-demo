import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitMigration1747597637401 implements MigrationInterface {
  name = 'InitMigration1747597637401'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "message" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sender" text NOT NULL,
                "user_id" text NOT NULL,
                "received_at" TIMESTAMP NOT NULL,
                "message" text NOT NULL,
                "message_stub_type" text NOT NULL,
                "message_stub_parameters" jsonb NOT NULL,
                CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id")
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "message"
        `)
  }
}
