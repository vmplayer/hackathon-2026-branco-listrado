import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMedicosConsultas1794620000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE medicos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(120) NOT NULL,
        cpf CHAR(11) NOT NULL UNIQUE CONSTRAINT ck_medicos_cpf CHECK (cpf ~ '^[0-9]{11}$'),
        crm VARCHAR(10) NOT NULL UNIQUE,
        crm_uf CHAR(2) NOT NULL,
        especialidade VARCHAR(80) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        email VARCHAR(150),
        data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
        ativo BOOLEAN NOT NULL DEFAULT TRUE
      );
      CREATE TABLE consultas (
        id SERIAL PRIMARY KEY,
        pacientes_id INT NOT NULL REFERENCES pacientes(id),
        medicos_id INT NOT NULL REFERENCES medicos(id),
        visitas_id INT REFERENCES visitas(id) ON DELETE SET NULL,
        data_hora TIMESTAMP NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'AGENDADA'
          CHECK (status IN ('AGENDADA','REALIZADA','CANCELADA','FALTOU')),
        motivo TEXT NOT NULL,
        diagnostico TEXT,
        prescricao TEXT,
        retorno DATE,
        observacao TEXT,
        data_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_consultas_paciente ON consultas(pacientes_id);
      CREATE INDEX idx_consultas_medico ON consultas(medicos_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE consultas, medicos');
  }
}
