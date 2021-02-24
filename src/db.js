import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(_query, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(_query, values);
    return result;
  } finally {
    client.release();
  }
}

// TODO rest af föllum
/**
 * Bætir við undirskrift.
 *
 * @param {array} data Fylki af gögnum fyrir umsókn
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function insert(data) {
  const q = 'INSERT INTO signatures(name, nationalId, comment, anonymous) VALUES ($1, $2, $3, $4)';
  const values = [data.name, data.nationalId, data.comment, data.anonymous];

  return query(q, values);
}

/**
 * Sækir allar undirskriftir
 *
 * @returns {array} Fylki af öllum umsóknum
 */
export async function select() {
  const result = await query('SELECT * FROM signatures ORDER BY id');

  return result.rows;
}

export async function deleteSignature(data) {
  const q = 'DELETE FROM signatures WHERE nationalID=$1';
  const values = [data.nationalId];
  return query(q, values);
}