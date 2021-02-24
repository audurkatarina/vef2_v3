import { promises } from 'fs';
import faker from 'faker';
import dotenv from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;

dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function query(q) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q.query, q.data);

    const { rows } = result;
    return rows;
  } finally {
    await client.end();
  }
}

function generateSignatures() {
  const signatures = [];
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
    signatures.push({ query: q, data: d });
  }
  return signatures;
}

async function main() {
  // bæta færslum við töflu
  try {
    const signatures = generateSignatures();
    signatures.map(async (signature) => {
      try {
        await query(signature);
      } catch (e) {
        console.error('Villa við að bæta gögnum við:', e.message);
      }
    });
    console.info('Gögnum bætt við');
  } catch (e) {
    console.error('Villa við að bæta gögnum við:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
