import { Pool } from 'pg'
import logger from './logger'
import { env } from './env'

// purpose: manage PostgreSQL connection pooling and provide query helper
// inputs: env database configuration
// outputs: `query` function, `dbPool` object
// status: stable

const pool = new Pool({
  host: env.dbHost,
  port: env.dbPort,
  database: env.dbName,
  user: env.dbUser,
  password: env.dbPassword,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : undefined,
});

// Helper function to execute queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

// Export the pool itself for transaction management
export { pool as dbPool };

pool.on('error', err => {
  logger.error({ err }, 'Unexpected error on idle client')
  process.exit(-1)
})
