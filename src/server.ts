import { AppDataSource } from './database/data-source';
import { createApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  await AppDataSource.initialize();
  const app = createApp(AppDataSource, env.CORS_ORIGIN);
  const server = app.listen(env.PORT, () => {
    console.log(`API disponível em http://localhost:${env.PORT}`);
  });
  server.on('error', async () => {
    console.error('Não foi possível iniciar o servidor HTTP');
    await AppDataSource.destroy();
    process.exitCode = 1;
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      try { await AppDataSource.destroy(); }
      finally { clearTimeout(timeout); }
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(() => {
  console.error('Falha ao conectar ao PostgreSQL. Verifique o .env e se o banco está disponível.');
  process.exitCode = 1;
});
