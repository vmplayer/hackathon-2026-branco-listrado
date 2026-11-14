import { ErrorRequestHandler } from 'express';
import { QueryFailedError } from 'typeorm';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor (public status: number, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: 'Dados inválidos', errors: error.issues.map(issue => ({
      field: issue.path.join('.'), message: issue.message,
    })) });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  
  if (error instanceof QueryFailedError) {
    const code = (error.driverError as { code?: string }).code;
    
    const mapped: Record<string, [number, string]> = {
      '23505': [409, 'Já existe um registro com esses dados únicos'],
      '23503': [409, 'Referência inexistente ou registro vinculado a outros dados'],
      '23514': [400, 'Os dados violam uma regra do banco de dados'],
      '23502': [400, 'Um campo obrigatório não foi informado'],
      '22001': [400, 'Um campo excede o tamanho permitido'],
      '22007': [400, 'Data inválida'],
      '22008': [400, 'Data inválida'],
    };

    if (code && mapped[code]) {
      const [status, message] = mapped[code];
      res.status(status).json({ message });
      return;
    }
  }

  const parserError = error as { type?: string } | null;

  if (parserError?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'JSON inválido' });
    return;
  }

  if (parserError?.type === 'entity.too.large') {
    res.status(413).json({ message: 'Corpo da requisição muito grande' });
    return;
  }
  
  console.error('Erro interno na API', error instanceof Error ? error.name : 'UnknownError');
  res.status(500).json({ message: 'Erro interno do servidor' });
};
