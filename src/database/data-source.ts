import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { entities } from '../entities';
import { InitialSchema1794614400000 } from './migrations/1794614400000-InitialSchema';
import { AddMedicosConsultas1794620000000 } from './migrations/1794620000000-AddMedicosConsultas';
import { RestructureCommunityData1794630000000 } from './migrations/1794630000000-RestructureCommunityData';
import { AddMicroareaObservation1794631000000 } from './migrations/1794631000000-AddMicroareaObservation';
import { AddAuthentication1794640000000 } from './migrations/1794640000000-AddAuthentication';
import { SeedAccessUsers1794650000000 } from './migrations/1794650000000-SeedAccessUsers';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities,
  migrations: [
    InitialSchema1794614400000,
    AddMedicosConsultas1794620000000,
    RestructureCommunityData1794630000000,
    AddMicroareaObservation1794631000000,
    AddAuthentication1794640000000,
    SeedAccessUsers1794650000000,
  ],
  synchronize: false,
  logging: false,
});
