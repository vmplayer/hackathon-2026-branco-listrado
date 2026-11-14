import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMicroareaObservation1794631000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE microareas ADD COLUMN observacao TEXT');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE microareas DROP COLUMN observacao');
  }
}
