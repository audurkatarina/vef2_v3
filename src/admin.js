import express from 'express';
import {
  catchErrors, paging, ensureAdmin, ensureLoggedIn,
} from './utils.js';
import { deleteSignature } from './db.js';
import passport from './login.js';

export const router = express.Router();

async function adminListi(req, res) {
  const {
    signatures,
    pageNumber,
    pageAll,
    count,
    links,
  } = await paging(req);

  const { user } = req;

  const data = {
    signatures,
    links,
    errors: [],
    count,
    pageAll,
    pageNumber,
    user,
  };
  return res.render('admin', data);
}

async function login(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { title: 'Innskráning', message });
}

async function deleteS(req, res) {
  const { id } = req.body;

  const answer = await deleteSignature(id);
  if (answer) {
    return res.redirect('/admin');
  }
  return res.status(404).json({ error: 'Not found' });
}

router.get('/', ensureLoggedIn, catchErrors(adminListi));
router.get('/login', login);
router.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/admin');
  },
);

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
router.post('/delete', ensureLoggedIn, ensureAdmin, catchErrors(deleteS));
