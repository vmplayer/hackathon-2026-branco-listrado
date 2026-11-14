import { MigrationInterface, QueryRunner } from 'typeorm';
import { hashPassword } from '../../auth/password';

export class SeedAccessUsers1794650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE usuarios DROP CONSTRAINT ck_usuario_vinculo;
      ALTER TABLE usuarios ADD CONSTRAINT ck_usuario_vinculo CHECK (
        (perfil = 'AGENTE' AND medico_id IS NULL) OR
        (perfil = 'MEDICO' AND agente_id IS NULL) OR
        (perfil = 'ADMIN' AND agente_id IS NULL AND medico_id IS NULL)
      );
    `);

    const contas = [
      {
        nome: 'Administrador da UBS',
        email: process.env.ADMIN_EMAIL || 'admin@ubs.local',
        senha: process.env.ADMIN_PASSWORD || 'admin123',
        perfil: 'ADMIN',
      },
      {
        nome: 'Agente de Saúde',
        email: process.env.AGENT_EMAIL || 'agente@ubs.local',
        senha: process.env.AGENT_PASSWORD || 'agente123',
        perfil: 'AGENTE',
      },
      {
        nome: 'Médico da UBS',
        email: process.env.DOCTOR_EMAIL || 'medico@ubs.local',
        senha: process.env.DOCTOR_PASSWORD || 'medico123',
        perfil: 'MEDICO',
      },
    ];

    for (const conta of contas) {
      await queryRunner.query(
        `INSERT INTO usuarios (nome, email, senha_hash, perfil)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET
           nome = EXCLUDED.nome,
           senha_hash = EXCLUDED.senha_hash,
           perfil = EXCLUDED.perfil,
           ativo = TRUE`,
        [conta.nome, conta.email, hashPassword(conta.senha), conta.perfil],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM usuarios
      WHERE email IN ('admin@ubs.local', 'agente@ubs.local', 'medico@ubs.local');
      ALTER TABLE usuarios DROP CONSTRAINT ck_usuario_vinculo;
      ALTER TABLE usuarios ADD CONSTRAINT ck_usuario_vinculo CHECK (
        (perfil = 'AGENTE' AND agente_id IS NOT NULL AND medico_id IS NULL) OR
        (perfil = 'MEDICO' AND medico_id IS NOT NULL AND agente_id IS NULL) OR
        (perfil = 'ADMIN' AND agente_id IS NULL AND medico_id IS NULL)
      );
    `);
  }
}
