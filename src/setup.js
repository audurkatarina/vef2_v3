//import fs from 'fs';
//import util from 'util';
import { promises } from 'fs';
import faker from 'faker';
import dotenv from 'dotenv';
import pkg from 'pg';
//import { readFile } from 'fs/promises';

const { Client } = pkg;

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new pkg.Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const schemaFile = './sql/schema.sql';

async function query(q, values = []) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q, values);

    const { rows } = result;
    return rows;
  } catch (err) {
    console.error('Error running query');
    throw err;
  } finally {
    await client.end();
  }
}

async function generateSignatures() {
  for (let i = 0; i < 500; i += 1) {
    const name = faker.name.findName();
    const nationalId = Math.random().toString().slice(2, 12);
    let comment = '';
    if (Math.random() < 0.5) {
      comment = faker.lorem.sentence();
    }
    let anon = false;
    if (Math.random() < 0.5) {
      anon = true;
    }
    const signed = faker.date.between('2021-02-10', '2021-02-24');
    const q = 'INSERT INTO signatures(name, nationalId, comment, anonymous, signed) VALUES ($1, $2, $3, $4, $5)';
    const d = [
      name,
      nationalId,
      comment,
      anon,
      signed,
    ];
    // eslint-disable-next-line no-await-in-loop
    await query(q, d);
  }
}

async function main() {
  const data = await promises.readFile(schemaFile);

  await query(data.toString('utf-8'));

  console.info('Schema created');

  await generateSignatures();

  console.info('Mock data inserted');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
});
