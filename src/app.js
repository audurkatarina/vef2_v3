import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

import passport from './login.js';
import { router as registrationRouter } from './registration.js';
//import { router as adminRoute } from './admin.js';

dotenv.config();

const {
  PORT: port = 3000,
  //SESSION_SECRET: sessionSecret,
  DATABASE_URL: connectionString,
} = process.env;

//if (!connectionString || !sessionSecret) {
if(!connectionString) {
  console.error('Vantar gögn í env');
  process.exit(1);
}

const app = express();

// TODO klára uppsetningu á appi
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static('public'));

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find((i) => i.param === field));
}

app.locals.isInvalid = isInvalid;

app.use('/', registrationRouter);

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: '404', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});