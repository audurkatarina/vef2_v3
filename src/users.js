import bcrypt from 'bcrypt';
import { query } from './db.js';

export async function comparePasswords(password, user) {
  const result = await bcrypt.compare(password, user.password);
  return result;
}

export async function findByUsername(username) {
  const q = 'SELECT * FROM users WHERE username = $1';

  const result = await query(q, [username]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

export async function findById(id) {
  const q = 'SELECT * FROM users WHERE id = $1';

  const result = await query(q, [id]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

export function serializeUser(user, done) {
  done(null, user.id);
}

export async function deserializeUser(id, done) {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
}
