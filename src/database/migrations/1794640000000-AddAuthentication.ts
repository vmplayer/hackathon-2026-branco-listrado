import { randomBytes } from 'node:crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { hashPassword } from '../../auth/password';

export class AddAuthentication1794640000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(120) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('AGENTE','MEDICO','ADMIN')),
        agente_id INT UNIQUE REFERENCES agentes(id) ON DELETE SET NULL,
        medico_id INT UNIQUE REFERENCES medicos(id) ON DELETE SET NULL,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT ck_usuario_vinculo CHECK (
          (perfil = 'AGENTE' AND agente_id IS NOT NULL AND medico_id IS NULL) OR
          (perfil = 'MEDICO' AND medico_id IS NOT NULL AND agente_id IS NULL) OR
          (perfil = 'ADMIN' AND agente_id IS NULL AND medico_id IS NULL)
        )
      );
      CREATE TABLE sessoes (
        token_hash CHAR(64) PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        expira_em TIMESTAMP NOT NULL
      );
      CREATE INDEX idx_sessoes_expiracao ON sessoes(expira_em);
    `);

    const email = process.env.ADMIN_EMAIL || 'admin@ubs.local';
    const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url');
    await queryRunner.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, 'ADMIN')`,
      ['Administrador da UBS', email, hashPassword(password)],
    );
    console.log(`Usuário administrador criado: ${email}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`Senha temporária do administrador: ${password}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE sessoes, usuarios');
  }
}
