# Copilot / AI Agent Instructions for ForoFoos 🚀

## Quick summary

- Minimal Express + EJS app (CommonJS). Main server is `app.js`. Views live in `src/views` (EJS). DB uses MySQL via `mysql2` (`src/config/db.js`) and environment variables (`.env` keys: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- Auth is session-based (`express-session`) and password checks use `bcrypt` (`src/controllers/authController.js`).
- Routes are declared under `src/routes` (not namespaced) and use small controllers under `src/controllers` and middlewares under `src/middlewares`.

---

## How to run / debug locally ✅

- Make sure a `.env` file exists with DB connection keys: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Start the server directly (project has no `start` script):
  - `node app.js`
- Server binds to port `3000` (see `app.js`) and prints an IP in the console message. If you change host/port, update `app.js` accordingly.

---

## Architecture & dataflow (big picture) 🔧

- `app.js` boots the Express server, sets `ejs` views, configures `express-session`, and mounts routes: `app.use('/', authRoutes)`.
- `src/routes/authRoutes.js` defines `/login`, `/logout`, `/dashboard` (protected via `isAuth`). Root (`/`) redirects to `/login`.
- `src/controllers/authController.js` uses `src/config/db.js` (a `mysql2` pool promise) to run parameterized SQL queries. Example pattern:
  - `const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);`
  - On successful auth: `req.session.userId = user.id` and `req.session.username = user.username`.
- Posting route exists in `app.js`: `POST /publicar` — it uses a callback-style `db.query` and currently inserts `usuario_id = 1` (hardcoded).

---

## Project-specific conventions & patterns 📚

- Language and comments are Spanish — prefer Spanish strings and comments when adding new UI text or messages.
- DB access uses raw SQL with parameterized queries (no ORM). Follow existing patterns (`db.execute` promise API) for new queries.
- Session values used by middleware: `req.session.userId` and `req.session.username`.
- Protect routes by adding middleware `isAuth` as the second argument: `router.get('/dashboard', isAuth, ...)`.
- Files are CommonJS (`require`, `module.exports`) — maintain this style unless an explicit migration to ESM is performed.

---

## Examples & snippets to follow (copy/paste friendly) ✂️

- Querying users (consistent pattern):
  - `const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);`
- Setting session after login:
  - `req.session.userId = user.id; req.session.username = user.username;`
- Protecting a route in a router file:
  - `router.get('/private', isAuth, (req,res) => res.render('private', { user: req.session.username }));`

---

## Integration points & important dependencies 🔗

- `mysql2` (DB) via `src/config/db.js` — uses `dotenv` to read `.env`.
- `express-session` for session state — secret is currently hard-coded in `app.js`.
- `bcrypt` for password comparison in `authController.js`.
- `ejs` templates under `src/views` render UI.
- `@capacitor/*` packages appear in `package.json` but are not used in current server code — review before removing or integrating.

---

## Linting y formateo (ESLint + Prettier) 🔧

- Archivos de configuración: `.eslintrc.json` y `.prettierrc`.
- Comandos:
  - `npm run lint` — ejecuta ESLint (usa `.eslintrc.json`).
  - `npm run lint:fix` — aplica `--fix` donde sea posible.
  - `npm run format` — formatea con Prettier.
- Hooks: Husky + `lint-staged` están configurados para ejecutar `eslint --fix` y `prettier --write` en los archivos staged (pre-commit), evitando commits con errores de estilo.
- Reglas notables: `no-console` es `warn`, `no-unused-vars` es `error`. Hay un `override` para tests (`**/*.test.js`) que permite importar devDependencies.
- Si encuentras errores en CI, ejecuta `npm run lint:fix` y vuelve a intentar el commit.

---

## Problemas comunes y TODOs (detectables) ⚠️

- **Duplicados y IP hardcodeada en `app.js`**
  - Problema: `app.set('view engine', 'ejs')` y `express.urlencoded` aparecen repetidos; el `console.log` muestra una IP fija.
  - Cómo arreglar:
    - Mantener una sola configuración para el motor de vistas y `express.urlencoded`.
    - Usar variables de entorno para host/port y usar `dotenv`:

```js
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor corriendo en: http://${HOST}:${PORT}`);
});
```

    - Mover rutas específicas (ej. `/publicar`) a un archivo de rutas como `src/routes/publicaciones.js` en vez de dejarlas en `app.js`.

- **`POST /publicar` usa callback y `usuario_id = 1`**
  - Problema: inserción con callback y user id fijo.
  - Cómo arreglar:
    - Proteger la ruta con `isAuth`.
    - Usar `db.execute` (promises/async) y `req.session.userId`.
    - Ejemplo (nuevo archivo `src/routes/publicaciones.js`):

```js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const isAuth = require('../middlewares/authMiddleware');

router.post('/publicar', isAuth, async (req, res) => {
  const { contenido } = req.body;
  const usuarioId = req.session.userId;
  try {
    await db.execute('INSERT INTO publicaciones (contenido, usuario_id) VALUES (?, ?)', [
      contenido,
      usuarioId,
    ]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
```

    - Montar la ruta en `app.js`: `app.use('/', require('./src/routes/publicaciones'));`

- **Secretos en código → mover a `.env`**
  - Problema: `session.secret` está hardcodeado.
  - Cómo arreglar:
    - Añadir `SESSION_SECRET` a `.env` y usar `process.env.SESSION_SECRET` en `app.js`.
    - Crear `.env.example` con keys: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SESSION_SECRET`, `PORT`.
    - Asegurar que `.env` está en `.gitignore`.

- **No hay scripts ni tests → preparar estructura mínima para testing**
  - Problema: `app.js` arranca el servidor directamente; no hay scripts ni pruebas.
  - Cómo arreglar:
    - Separar `app` y `server` (exportar `app` desde `app.js`, crear `server.js` para hacer `listen`).

```js
// app.js
const express = require('express');
const app = express();
// config y rutas...
module.exports = app;

// server.js
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening ${PORT}`));
```

    - Añadir scripts en `package.json`:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest --runInBand"
}
```

    - Añadir dependencias dev opcionales: `jest`, `supertest`, y un test básico `test/auth.test.js`:

```js
const request = require('supertest');
const app = require('../app');

test('GET /login -> 200', async () => {
  const res = await request(app).get('/login');
  expect(res.statusCode).toBe(200);
});
```

---

## Where to look for changes

- Routes & endpoints: `src/routes/*.js`
- Business logic: `src/controllers/*.js`
- Auth checks: `src/middlewares/authMiddleware.js`
- DB pooling & config: `src/config/db.js`
- View templates & UI: `src/views/*.ejs`

---

If any of these sections are unclear or you'd like me to include guidance on adding tests, CI, or a `start` script, tell me which area to expand and I'll iterate. ✅
