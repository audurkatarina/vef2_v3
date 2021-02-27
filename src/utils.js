/* eslint-disable no-underscore-dangle */
import { selectPaging, selectCount } from './db.js';

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
export function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Passar upp á að það sé innskráður notandi í request. Skilar næsta middleware
 * ef svo er, annars redirect á /login
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {funcion} next Næsta middleware
 */
export function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/admin/login');
}

/**
 * Passar upp á að innskráður notandi sé admin. Skilar næsta middleware ef svo
 * er, annars redirect á /login
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {funcion} next Næsta middleware
 */
export function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user && req.user.admin) {
    return next();
  }

  return res.redirect('/admin/login');
}

export async function signaturesTable(offset, limit) {
  const signatures = await selectPaging(offset, limit);
  signatures.forEach((signature) => {
    const d = new Date(signature.signed);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const date = `${day}.${month}.${d.getFullYear()}`;
    // eslint-disable-next-line no-param-reassign
    signature.signed = date;
  });
  return signatures;
}

export async function paging(req) {
  let { offset = 0, limit = 50 } = req.query;
  offset = Number(offset);
  limit = Number(limit);
  const signatures = await signaturesTable(offset, limit);

  const count = await selectCount();
  const pageNumber = offset / 50 + 1;
  const pageAll = Math.ceil(count / limit);

  const links = {
    _links: {
      self: {
        href: `${req.baseUrl}/?offset=${offset}&limit=${limit}`,
      },
    },
  };

  if (offset > 0) {
    links._links.prev = {
      href: `${req.baseUrl}/?offset=${offset - limit}&limit=${limit}`,
    };
  }

  // eslint-disable-next-line eqeqeq
  if (signatures.length === limit && offset + limit != count) {
    links._links.next = {
      href: `${req.baseUrl}/?offset=${Number(offset) + limit}&limit=${limit}`,
    };
  }

  const data = {
    signatures,
    pageNumber,
    pageAll,
    count,
    links,
  };
  return data;
}
