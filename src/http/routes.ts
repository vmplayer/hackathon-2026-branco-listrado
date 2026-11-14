import { Router } from 'express';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { z } from 'zod';
import { Area, Microarea, Rua, Familia, Agente, Paciente, Visita } from '../entities';
import { dateSchema, idSchema, schemas, validateVisit } from '../validation/schemas';
import { HttpError } from './errors';

const boolQuery = z.enum(['true', 'false']).transform(value => value === 'true');

const resources: Array<{
  name: keyof typeof schemas;
  entity: EntityTarget<ObjectLiteral>;
  filters: z.ZodRawShape;
}> = [
  { name: 'areas', entity: Area, filters: { nome: schemas.areas.shape.nome.optional() } },
  { name: 'microareas', entity: Microarea, filters: { area_id: idSchema.optional(), ativa: boolQuery.optional() } },
  { name: 'ruas', entity: Rua, filters: { microarea_id: idSchema.optional() } },
  { name: 'familia', entity: Familia, filters: { ruas_id: idSchema.optional(), ativa: boolQuery.optional() } },
  { name: 'agentes', entity: Agente, filters: { microarea_id: idSchema.optional(), ativo: boolQuery.optional() } },
  { name: 'pacientes', entity: Paciente, filters: { familia_id: idSchema.optional(), ativo: boolQuery.optional() } },
  { name: 'visitas', entity: Visita, filters: {
    pacientes_id: idSchema.optional(), agentes_id: idSchema.optional(),
    data_visita: dateSchema.optional(), situacao: schemas.visitas.shape.situacao.optional(),
  } },
];

export function createRoutes(dataSource: DataSource): Router {
  const router = Router();
  
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
      const body = schema.parse(req.body);
    
      if (name === 'visitas') validateVisit(body);
      const repo = repository();
    
      const record = await repo.save(repo.create(body));
      res.location(`/api/${name}/${record.id}`).status(201).json(record);
    });
    
    router.patch(`/${name}/:id`, async (req, res) => {
      const id = idSchema.parse(req.params.id);
      const body = schema.partial().parse(req.body);
      if (!Object.keys(body).length) throw new HttpError(400, 'Informe ao menos um campo');
      const record = await dataSource.transaction(async manager => {
        const repo = manager.getRepository(entity);
        const current = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
    
        if (!current) throw new HttpError(404, 'Registro não encontrado');
        const updated = repo.merge(current, body);
    
        if (name === 'visitas') validateVisit(updated);
        return repo.save(updated);
      });

      res.json(record);
    });

    router.delete(`/${name}/:id`, async (req, res) => {
      const id = idSchema.parse(req.params.id);
      const result = await repository().delete(id);
    
      if (!result.affected) throw new HttpError(404, 'Registro não encontrado');
      res.status(204).send();
    });
  }
  
  return router;
}
