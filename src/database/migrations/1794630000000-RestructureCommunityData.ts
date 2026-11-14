import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestructureCommunityData1794630000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cidades (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(150) NOT NULL UNIQUE
      );
      INSERT INTO cidades (nome)
      SELECT DISTINCT trim(nome) FROM areas
      ON CONFLICT (nome) DO NOTHING;

      ALTER TABLE microareas ADD COLUMN cidade_id INT;
      UPDATE microareas m
      SET cidade_id = c.id
      FROM cidades c
      JOIN areas a ON c.nome = trim(a.nome)
      WHERE m.area_id = a.id;
      ALTER TABLE microareas ALTER COLUMN cidade_id SET NOT NULL;
      ALTER TABLE microareas ADD CONSTRAINT fk_microareas_cidade
        FOREIGN KEY (cidade_id) REFERENCES cidades(id);
      CREATE INDEX idx_microareas_cidade ON microareas(cidade_id);
      ALTER TABLE microareas DROP CONSTRAINT IF EXISTS microareas_area_id_fkey;
      ALTER TABLE microareas DROP COLUMN area_id;
      DROP TABLE areas;

      ALTER TABLE familia ADD COLUMN microarea_id INT;
      ALTER TABLE familia ADD COLUMN endereco VARCHAR(300);
      ALTER TABLE familia ADD COLUMN bairro VARCHAR(100);
      ALTER TABLE familia ADD COLUMN cep VARCHAR(9);
      ALTER TABLE familia ADD COLUMN descricao VARCHAR(150);
      UPDATE familia f
      SET microarea_id = r.microarea_id,
          endereco = r.nome,
          bairro = m.bairro,
          cep = m.cep
      FROM ruas r
      JOIN microareas m ON m.id = r.microarea_id
      WHERE f.ruas_id = r.id;
      ALTER TABLE familia ALTER COLUMN microarea_id SET NOT NULL;
      ALTER TABLE familia ALTER COLUMN endereco SET NOT NULL;
      ALTER TABLE familia ALTER COLUMN bairro SET NOT NULL;
      ALTER TABLE familia ADD CONSTRAINT fk_familia_microarea
        FOREIGN KEY (microarea_id) REFERENCES microareas(id);
      CREATE INDEX idx_familia_microarea ON familia(microarea_id);
      ALTER TABLE familia DROP CONSTRAINT IF EXISTS familia_ruas_id_fkey;
      ALTER TABLE familia DROP COLUMN ruas_id;
      ALTER TABLE familia DROP COLUMN complemento;
      DROP TABLE ruas;

      ALTER TABLE pacientes ADD COLUMN endereco VARCHAR(300);

      ALTER TABLE visitas DROP CONSTRAINT IF EXISTS ck_visitas_situacao;
      UPDATE visitas SET situacao = 'OUTRO'
      WHERE situacao NOT IN ('IDOSO', 'CRIANCA', 'GESTANTE', 'ACAMADO', 'OUTRO');
      ALTER TABLE visitas ADD CONSTRAINT ck_visitas_situacao
        CHECK (situacao IN ('IDOSO','CRIANCA','GESTANTE','ACAMADO','OUTRO'));

      ALTER TABLE consultas ADD COLUMN data_ultima_visita DATE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE consultas DROP COLUMN data_ultima_visita;
      ALTER TABLE pacientes DROP COLUMN endereco;
      ALTER TABLE familia ADD COLUMN ruas_id INT;
      ALTER TABLE familia ADD COLUMN complemento VARCHAR(100);
      ALTER TABLE familia DROP CONSTRAINT IF EXISTS fk_familia_microarea;
      ALTER TABLE familia DROP COLUMN microarea_id;
      ALTER TABLE familia DROP COLUMN endereco;
      ALTER TABLE familia DROP COLUMN bairro;
      ALTER TABLE familia DROP COLUMN cep;
      ALTER TABLE familia DROP COLUMN descricao;
      DROP TABLE cidades CASCADE;
    `);
  }
}
