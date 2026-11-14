import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794614400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE areas (
        id SERIAL PRIMARY KEY,
        nome CHAR(1) NOT NULL UNIQUE CONSTRAINT ck_areas_nome CHECK (nome IN ('A','B','C','D'))
      );

      CREATE TABLE microareas (
        id SERIAL PRIMARY KEY,
        area_id INT NOT NULL REFERENCES areas(id),
        descricao VARCHAR(150), cidade VARCHAR(150) NOT NULL,
        bairro VARCHAR(100) NOT NULL, cep VARCHAR(9), complemento TEXT,
        ativa BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE ruas (
        id SERIAL PRIMARY KEY,
        microarea_id INT NOT NULL REFERENCES microareas(id),
        numero INT NOT NULL CONSTRAINT ck_ruas_numero CHECK (numero BETWEEN 1 AND 40),
        nome VARCHAR(150) NOT NULL,
        CONSTRAINT uq_ruas_microarea_numero UNIQUE (microarea_id, numero)
      );

      CREATE TABLE familia (
        id SERIAL PRIMARY KEY, ruas_id INT NOT NULL REFERENCES ruas(id),
        numero INT NOT NULL, complemento VARCHAR(100),
        responsavel VARCHAR(150) NOT NULL, ativa BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE agentes (
        id SERIAL PRIMARY KEY, microarea_id INT NOT NULL REFERENCES microareas(id),
        nome VARCHAR(120) NOT NULL,
        cpf CHAR(11) NOT NULL UNIQUE CONSTRAINT ck_agentes_cpf CHECK (cpf ~ '^[0-9]{11}$'),
        telefone VARCHAR(20) NOT NULL, email VARCHAR(150),
        data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
        ativo BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE pacientes (
        id SERIAL PRIMARY KEY, familia_id INT NOT NULL REFERENCES familia(id),
        carteira_sus VARCHAR(15) NOT NULL UNIQUE CONSTRAINT ck_pacientes_sus CHECK (carteira_sus ~ '^[0-9]{15}$'),
        nome VARCHAR(120) NOT NULL,
        cpf CHAR(11) NOT NULL UNIQUE CONSTRAINT ck_pacientes_cpf CHECK (cpf ~ '^[0-9]{11}$'),
        email VARCHAR(150), data_nasc DATE NOT NULL,
        sexo CHAR(1) NOT NULL CONSTRAINT ck_pacientes_sexo CHECK (sexo IN ('M','F')),
        telefone VARCHAR(20) NOT NULL, alergia TEXT,
        tipo_sanguineo VARCHAR(3) CONSTRAINT ck_pacientes_sangue CHECK (tipo_sanguineo IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
        historico TEXT, ativo BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE visitas (
        id SERIAL PRIMARY KEY, pacientes_id INT NOT NULL REFERENCES pacientes(id),
        agentes_id INT NOT NULL REFERENCES agentes(id), data_visita DATE NOT NULL,
        situacao VARCHAR(30) NOT NULL CONSTRAINT ck_visitas_situacao CHECK (situacao IN ('REALIZADA','AUSENTE','RECUSADA','REAGENDADA')),
        orientacao TEXT, historico TEXT, encaminhamento BOOLEAN NOT NULL DEFAULT FALSE,
        descricao_encaminhamento TEXT, prox_visita DATE, observacao TEXT,
        CONSTRAINT ck_visitas_proxima CHECK (prox_visita IS NULL OR prox_visita >= data_visita),
        CONSTRAINT ck_visitas_encaminhamento CHECK (encaminhamento = FALSE OR descricao_encaminhamento IS NOT NULL)
      );
      
      CREATE INDEX idx_microareas_area ON microareas(area_id);
      CREATE INDEX idx_ruas_microarea ON ruas(microarea_id);
      CREATE INDEX idx_familia_rua ON familia(ruas_id);
      CREATE INDEX idx_agentes_microarea ON agentes(microarea_id);
      CREATE INDEX idx_pacientes_familia ON pacientes(familia_id);
      CREATE INDEX idx_visitas_paciente ON visitas(pacientes_id);
      CREATE INDEX idx_visitas_agente ON visitas(agentes_id);
      CREATE INDEX idx_visitas_data ON visitas(data_visita);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE visitas, pacientes, agentes, familia, ruas, microareas, areas');
  }
}
