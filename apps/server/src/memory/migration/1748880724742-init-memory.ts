import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migration1749134506974 implements MigrationInterface {
  name = 'Migration1749134506974'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "memory" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" character varying NOT NULL,
                "title" character varying NOT NULL,
                "content" character varying NOT NULL,
                "tags" text array NOT NULL,
                CONSTRAINT "PK_719a982d08209b92cd1a0b1c4ec" PRIMARY KEY ("id")
            )
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "memory"
        `)
  }
}
