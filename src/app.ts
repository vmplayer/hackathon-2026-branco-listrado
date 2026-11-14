import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { createRoutes } from './http/routes';
import { errorHandler } from './http/errors';

export function createApp(dataSource: DataSource, corsOrigin = 'http://localhost:5173') {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } } }));
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/health', async (_req, res) => {
    try {
      await dataSource.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });
  app.use('/api', createRoutes(dataSource));
  app.use(express.static(path.join(__dirname, '../front')));
  app.use((_req, res) => { res.status(404).json({ message: 'Rota não encontrada' }); });
  app.use(errorHandler);
  return app;
}
