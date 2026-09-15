import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { existsSync, readFileSync } from 'fs';
import { join, extname } from 'path';

// DataSource for the TypeORM CLI (migration:run / migration:revert).
// Works from src/ (ts-node) and dist/ (compiled JS).

function loadEnv() {
  const envPath = join(__dirname, '..', '..', '.env');
  if (!existsSync(envPath)) return;

  const env = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'));

  for (const line of env) {
    const [key, ...valueParts] = line.split('=');
    // Real environment variables (e.g. set by the server) win over .env
    if (!key || process.env[key.trim()] !== undefined) continue;
    process.env[key.trim()] = valueParts.join('=').trim();
  }
}

loadEnv();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'cooldesk',
  synchronize: false,
  logging: false,
  // .ts under ts-node, .js in dist — never the dist/*.d.ts files
  entities: [join(__dirname, '..', '**', `*.entity${extname(__filename)}`)],
  migrations: [join(__dirname, 'migrations', `*${extname(__filename)}`)],
});
