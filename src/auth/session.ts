import { createHash, randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';

export type Perfil = 'AGENTE' | 'MEDICO' | 'ADMIN';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  agente_id?: number | null;
  medico_id?: number | null;
  microarea_id?: number | null;
  cidade_id?: number | null;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function criarSessao(dataSource: DataSource, usuarioId: number): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await dataSource.query(
    `INSERT INTO sessoes (token_hash, usuario_id, expira_em)
     VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '8 hours')`,
    [hashToken(token), usuarioId],
  );
  return token;
}

export async function buscarUsuarioPorToken(
  dataSource: DataSource,
  token: string,
): Promise<UsuarioAutenticado | null> {
  const rows = await dataSource.query(
    `SELECT u.id, u.nome, u.email, u.perfil, u.agente_id, u.medico_id,
            a.microarea_id, ma.cidade_id
     FROM sessoes s
     JOIN usuarios u ON u.id = s.usuario_id
     LEFT JOIN agentes a ON a.id = u.agente_id
     LEFT JOIN microareas ma ON ma.id = a.microarea_id
     WHERE s.token_hash = $1 AND s.expira_em > CURRENT_TIMESTAMP AND u.ativo = TRUE`,
    [hashToken(token)],
  );
  return rows[0] || null;
}
