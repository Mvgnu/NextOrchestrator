import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'marsnext_db',
  user: process.env.DB_USER || 'marsnext_user',
  password: process.env.DB_PASSWORD || 'strongpassword',
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Helper function to execute queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

// Export the pool itself for transaction management
export { pool as dbPool };

// Optional: A dedicated function to get a client could also be exported
// export const getDbClient = async () => {
//   const client = await pool.connect();
//   return client;
// };

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
}); 