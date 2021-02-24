import express from 'express';
import xss from 'xss';
import pkg from 'express-validator';
import { insert, select } from './db.js';

const { check, validationResult, body } = pkg;

const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
   * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
   *
   * @param {string} fieldName Heiti á reit
   * @returns {function} Middleware sem hreinsar reit ef hann finnst
   */
function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }

    const field = req.body[fieldName];

    if (field) {
      req.body[fieldName] = xss(field);
    }

    next();
  };
}

export const router = express.Router();

const validations = [
  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  check('nationalId')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  check('nationalId')
    .matches(new RegExp(nationalIdPattern))
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),
  check('comment')
    .isLength({ max: 400 })
    .withMessage('Athugasemd má að hámarki vera 400 stafir'),
];

const sanitazions = [
  body('name').trim().escape(),
  sanitizeXss('name'),

  body('nationalId').blacklist('-'),
  sanitizeXss('nationalId'),
  sanitizeXss('anon'),
  sanitizeXss('comment'),
];

/**
 * Route handler fyrir form.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Formi fyrir umsókn
 */
async function form(req, res) {
  const signatures = await select();
  signatures.forEach((signature) => {
    const d = new Date(signature.signed);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const date = `${day}.${month}.${d.getFullYear()}`;
    // eslint-disable-next-line no-param-reassign
    signature.signed = date;
  });

  const data = {
    title: 'Undirskriftarlisti',
    name: '',
    nationalId: '',
    comment: '',
    signatures,
    errors: [],
  };
  res.render('index', data);
}

/**
 * Route handler sem athugar stöðu á formi og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */
async function showErrors(req, res, next) {
  const {
    body: {
      name = '',
      nationalId = '',
      comment = '',
    } = {},
  } = req;
  const signatures = await select();
  signatures.forEach((signature) => {
    const d = new Date(signature.signed);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const date = `${day}.${month}.${d.getFullYear()}`;
    // eslint-disable-next-line no-param-reassign
    signature.signed = date;
  });

  const data = {
    name,
    nationalId,
    comment,
    signatures,
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;

    return res.render('index', data);
  }

  return next();
}

/**
 * Ósamstilltur route handler sem vistar gögn í gagnagrunn og sendir
 * á þakkarsíðu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function formPost(req, res) {
  const {
    body: {
      name = '',
      nationalId = '',
      comment = '',
    } = {},
  } = req;

  let anonymous = false;
  if (req.body.anon === 'on') {
    anonymous = true;
  }

  const data = {
    name,
    nationalId,
    comment,
    anonymous,
  };

  try {
    await insert(data);
  } catch (e) {
    console.error('Villa við að bæta gögnum við:', e.message);
  }

  return res.redirect('/');
}

router.get('/', catchErrors(form));

router.post(
  '/',
  // Athugar hvort form sé í lagi
  validations,
  // Ef form er ekki í lagi, birtir upplýsingar um það
  showErrors,
  // Öll gögn í lagi, hreinsa þau
  sanitazions,
  // Senda gögn í gagnagrunn
  catchErrors(formPost),
);
