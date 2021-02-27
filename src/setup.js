import { promises } from 'fs';
import faker from 'faker';
import { query, end } from './db.js';

const schemaFile = './sql/schema.sql';

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
    const date = new Date();
    const dateStringTo = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const dateStringFrom = `${date.getFullYear()}-${date.getMonth()}-${Math.floor(date.getDate() - 14 * Math.random())}`;
    const signed = faker.date.between(dateStringFrom, dateStringTo);
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

  await end();
}

main().catch((err) => {
  console.error(err);
});
