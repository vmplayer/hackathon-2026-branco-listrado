import { z } from 'zod';

export const idSchema = z.coerce.number().int().positive().max(2147483647);
const integer = z.number().int().min(-2147483648).max(2147483647);
const fk = integer.positive();
const text = (length: number) => z.string().trim().min(1).max(length);
const optionalText = (length: number) => z.string().max(length).nullable().optional();
const longText = z.string().nullable().optional();
const cpf = z.string().regex(/^[0-9]{11}$/, 'CPF deve conter 11 dígitos, sem pontuação');
const email = z.string().trim().email().max(150).nullable().optional();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine(value => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return value >= '0001-01-01' &&
  !Number.isNaN(parsed.getTime()) &&
  parsed.toISOString().slice(0, 10) === value;
},'Data inválida');

export const schemas = {
  areas: z.object({ nome: z.enum(['A', 'B', 'C', 'D']) }).strict(),
  microareas: z.object({
    area_id: fk,
    descricao: optionalText(150),
    cidade: text(150),
    bairro: text(100),
    cep: optionalText(9),
    complemento: longText,
    ativa: z.boolean().optional()
  }).strict(),
  ruas: z.object({ 
    microarea_id: fk,
    numero: integer.min(1).max(40),
    nome: text(150)
  }).strict(),
  familia: z.object({
    ruas_id: fk,
    numero: integer,
    complemento: optionalText(100),
    responsavel: text(150),
    ativa: z.boolean().optional()
  }).strict(),
  agentes: z.object({
    microarea_id: fk,
    nome: text(120),
    cpf,
    telefone: text(20),
    email,
    data_cadastro: dateSchema.optional(),
    ativo: z.boolean().optional()
  }).strict(),
  pacientes: z.object({
    familia_id: fk, carteira_sus: z.string().regex(/^[0-9]{15}$/, 'SUS deve conter 15 dígitos'),
    nome: text(120), cpf, email, data_nasc: dateSchema, sexo: z.enum(['M', 'F']),
    telefone: text(20), alergia: longText,
    tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).nullable().optional(),
    historico: longText, ativo: z.boolean().optional(),
  }).strict(),
  visitas: z.object({
    pacientes_id: fk, agentes_id: fk, data_visita: dateSchema,
    situacao: z.enum(['REALIZADA', 'AUSENTE', 'RECUSADA', 'REAGENDADA']),
    orientacao: longText, historico: longText, encaminhamento: z.boolean().optional(),
    descricao_encaminhamento: longText, prox_visita: dateSchema.nullable().optional(), observacao: longText,
  }).strict(),
};

// Executada também após mesclar um PATCH com o registro atual.
export function validateVisit(value: Record<string, unknown>): void {
  const issues: z.ZodIssue[] = [];
  if (value.prox_visita && String(value.prox_visita) < String(value.data_visita)) {
    issues.push({ code: 'custom', path: ['prox_visita'], message: 'Próxima visita deve ser igual ou posterior à data da visita' });
  }
  if (value.encaminhamento === true &&
      (typeof value.descricao_encaminhamento !== 'string' || !value.descricao_encaminhamento.trim())) {
    issues.push({ code: 'custom', path: ['descricao_encaminhamento'], message: 'Informe a descrição do encaminhamento' });
  }
  if (issues.length) throw new z.ZodError(issues);
}
