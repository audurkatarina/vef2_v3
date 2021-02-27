import passport from 'passport';
import pkg from 'passport-local';
import {
  findByUsername, comparePasswords, findById,
} from './users.js';

const { Strategy } = pkg;

/**
 * Athugar hvort username og password sé til í notandakerfi.
 * Callback tekur við villu sem fyrsta argument, annað argument er
 * - `false` ef notandi ekki til eða lykilorð vitlaust
 * - Notandahlutur ef rétt
 *
 * @param {string} username Notandanafn til að athuga
 * @param {string} password Lykilorð til að athuga
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
async function userStrategy(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    const passwordsMatch = await comparePasswords(password, user);

    if (passwordsMatch) {
      return done(null, user);
    }
  } catch (err) {
    console.error(err);
    return done(err);
  }

  return done(null, false);
}

passport.use(new Strategy(userStrategy));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
