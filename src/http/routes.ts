import { NextFunction, Request, Response, Router } from 'express';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { z } from 'zod';
import { Cidade, Microarea, Familia, Agente, Paciente, Visita, Medico, Consulta } from '../entities';
import { dateSchema, idSchema, schemas, validateVisit } from '../validation/schemas';
import { HttpError } from './errors';
import { buscarUsuarioPorToken, criarSessao, hashToken, Perfil, UsuarioAutenticado } from '../auth/session';
import { hashPassword, verifyPassword } from '../auth/password';

const boolQuery = z.enum(['true', 'false']).transform(value => value === 'true');
const loginSchema = z.object({
  email: z.string().trim().email(),
  senha: z.string().min(1).max(200),
}).strict();
type AuthenticatedRequest = Request & { usuario?: UsuarioAutenticado };

function tokenDaRequisicao(req: Request): string | null {
  const cookies = req.headers.cookie?.split(';').map(cookie => cookie.trim()) || [];
  const cookie = cookies.find(item => item.startsWith('proagente_session='));
  return cookie ? decodeURIComponent(cookie.slice('proagente_session='.length)) : null;
}

function exigirAutenticacao(dataSource: DataSource) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const token = tokenDaRequisicao(req);
    if (!token) throw new HttpError(401, 'Faça login para continuar');
    const usuario = await buscarUsuarioPorToken(dataSource, token);
    if (!usuario) throw new HttpError(401, 'Sessão expirada. Faça login novamente');
    req.usuario = usuario;
    next();
  };
}

const permissoesDeAlteracao: Record<Exclude<Perfil, 'ADMIN'>, string[]> = {
  AGENTE: ['familia', 'pacientes', 'visitas'],
  MEDICO: ['familia', 'pacientes', 'visitas', 'consultas'],
};

function exigirPermissao(req: AuthenticatedRequest, recurso: string): void {
  const perfil = req.usuario?.perfil;
  if (perfil === 'ADMIN') return;
  if (!perfil || !permissoesDeAlteracao[perfil].includes(recurso)) {
    throw new HttpError(403, 'Seu perfil não tem permissão para alterar este cadastro');
  }
}

async function atualizarContaVinculada(
  dataSource: DataSource,
  recurso: string,
  registroId: number,
  senha: string | undefined,
  nome: string,
  email: string | null | undefined,
): Promise<void> {
  const [coluna, perfil] = recurso === 'agentes' ? ['agente_id', 'AGENTE'] : ['medico_id', 'MEDICO'];
  const existentes = await dataSource.query(
    `SELECT id FROM usuarios WHERE ${coluna} = $1 OR lower(email) = lower($2) LIMIT 1`,
    [registroId, email || ''],
  );
  if (existentes[0]) {
    if (!email) return;
    if (senha) {
      await dataSource.query(
        `UPDATE usuarios SET nome = $1, email = $2, senha_hash = $3, ${coluna} = $4, ativo = TRUE WHERE id = $5`,
        [nome, email, hashPassword(senha), registroId, existentes[0].id],
      );
    } else {
      await dataSource.query(
        `UPDATE usuarios SET nome = $1, email = $2, ${coluna} = $3, ativo = TRUE WHERE id = $4`,
        [nome, email, registroId, existentes[0].id],
      );
    }
    return;
  }
  if (!senha || !email) return;
  await dataSource.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil, ${coluna})
     VALUES ($1, $2, $3, $4, $5)`,
    [nome, email, hashPassword(senha), perfil, registroId],
  );
}

const resources: Array<{
  name: keyof typeof schemas;
  entity: EntityTarget<ObjectLiteral>;
  filters: z.ZodRawShape;
}> = [
  { name: 'cidades', entity: Cidade, filters: { nome: schemas.cidades.shape.nome.optional() } },
  { name: 'microareas', entity: Microarea, filters: { cidade_id: idSchema.optional(), ativa: boolQuery.optional() } },
  { name: 'familia', entity: Familia, filters: { microarea_id: idSchema.optional() } },
  { name: 'agentes', entity: Agente, filters: { microarea_id: idSchema.optional(), ativo: boolQuery.optional() } },
  { name: 'pacientes', entity: Paciente, filters: { familia_id: idSchema.optional(), ativo: boolQuery.optional() } },
  { name: 'visitas', entity: Visita, filters: {
    pacientes_id: idSchema.optional(), agentes_id: idSchema.optional(),
    data_visita: dateSchema.optional(), situacao: schemas.visitas.shape.situacao.optional(),
  } },
  { name: 'medicos', entity: Medico, filters: { ativo: boolQuery.optional() } },
  { name: 'consultas', entity: Consulta, filters: {
    pacientes_id: idSchema.optional(), medicos_id: idSchema.optional(),
    status: schemas.consultas.shape.status.optional(),
  } },
];

export function createRoutes(dataSource: DataSource): Router {
  const router = Router();

  router.post('/auth/login', async (req, res) => {
    const { email, senha } = loginSchema.parse(req.body);
    const rows = await dataSource.query(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.perfil, u.agente_id, u.medico_id,
              a.microarea_id, ma.cidade_id
       FROM usuarios u
       LEFT JOIN agentes a ON a.id = u.agente_id
       LEFT JOIN microareas ma ON ma.id = a.microarea_id
       WHERE lower(u.email) = lower($1) AND u.ativo = TRUE`,
      [email],
    );
    const usuario = rows[0];
    if (!usuario || !verifyPassword(senha, usuario.senha_hash)) {
      throw new HttpError(401, 'Email ou senha inválidos');
    }
    const token = await criarSessao(dataSource, usuario.id);
    res.cookie('proagente_session', token, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000, path: '/',
    });
    res.json({
      id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil,
      agente_id: usuario.agente_id, medico_id: usuario.medico_id,
      microarea_id: usuario.microarea_id, cidade_id: usuario.cidade_id,
    });
  });

  router.get('/auth/me', async (req, res) => {
    const token = tokenDaRequisicao(req);
    if (!token) return res.status(401).json({ message: 'Não autenticado' });
    const usuario = await buscarUsuarioPorToken(dataSource, token);
    if (!usuario) return res.status(401).json({ message: 'Sessão expirada' });
    res.json(usuario);
  });

  router.post('/auth/logout', async (req, res) => {
    const token = tokenDaRequisicao(req);
    if (token) await dataSource.query('DELETE FROM sessoes WHERE token_hash = $1', [hashToken(token)]);
    res.clearCookie('proagente_session', { httpOnly: true, sameSite: 'lax', path: '/' });
    res.status(204).send();
  });

  router.use(exigirAutenticacao(dataSource));
  
  for (const { name, entity, filters } of resources) {
    const schema = schemas[name];
    const querySchema = z.object({
      page: z.coerce.number().int().min(1).max(1000000).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      ...filters,
    }).strict();

    const repository = () => dataSource.getRepository(entity);
    router.get(`/${name}`, async (req, res) => {
      const { page, limit, ...where } = querySchema.parse(req.query);
    
      const [data, total] = await repository().findAndCount({
        where, order: { id: 'ASC' }, skip: (page - 1) * limit, take: limit,
      });
    
      res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
    });

    router.get(`/${name}/:id`, async (req, res) => {
      const id = idSchema.parse(req.params.id);
      const record = await repository().findOneBy({ id });
    
      if (!record) throw new HttpError(404, 'Registro não encontrado');
      
      res.json(record);
    });

    router.post(`/${name}`, async (req, res) => {
      exigirPermissao(req as AuthenticatedRequest, name);
      const body = schema.parse(req.body) as Record<string, unknown>;
      const senha = typeof body.senha_acesso === 'string' ? body.senha_acesso : undefined;
      delete body.senha_acesso;
    
      if (name === 'visitas') validateVisit(body);
      const repo = repository();
    
      const record = await repo.save(repo.create(body));
      if (name === 'agentes' || name === 'medicos') {
        await atualizarContaVinculada(dataSource, name, record.id, senha, record.nome, record.email);
      }
      res.location(`/api/${name}/${record.id}`).status(201).json(record);
    });
    
    router.patch(`/${name}/:id`, async (req, res) => {
      exigirPermissao(req as AuthenticatedRequest, name);
      const id = idSchema.parse(req.params.id);
      const body = schema.partial().parse(req.body) as Record<string, unknown>;
      const senha = typeof body.senha_acesso === 'string' ? body.senha_acesso : undefined;
      delete body.senha_acesso;
      if (!Object.keys(body).length && !senha) throw new HttpError(400, 'Informe ao menos um campo');
      const record = await dataSource.transaction(async manager => {
        const repo = manager.getRepository(entity);
        const current = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
    
        if (!current) throw new HttpError(404, 'Registro não encontrado');
        const updated = repo.merge(current, body);
    
        if (name === 'visitas') validateVisit(updated);
        return repo.save(updated);
      });
      if ((name === 'agentes' || name === 'medicos') && senha) {
        await atualizarContaVinculada(dataSource, name, id, senha, record.nome, record.email);
      }

      res.json(record);
    });

    router.delete(`/${name}/:id`, async (req, res) => {
      exigirPermissao(req as AuthenticatedRequest, name);
      const id = idSchema.parse(req.params.id);
      const result = await repository().delete(id);
    
      if (!result.affected) throw new HttpError(404, 'Registro não encontrado');
      res.status(204).send();
    });
  }
  
  return router;
}
