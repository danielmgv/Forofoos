const request = require('supertest');
const app = require('../app');

jest.mock('../src/config/db', () => ({
  execute: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed_pass')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

const db = require('../src/config/db');

describe('Registro de usuarios', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /register -> 200 y muestra formulario', async () => {
    const res = await request(app).get('/register');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Crear Cuenta/);
  });

  test('POST /auth/register con campos vacíos -> muestra error', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: '', email: '', password: '' });

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Todos los campos son obligatorios/);
  });

  test('POST /auth/register con email existente -> muestra error', async () => {
    db.execute.mockResolvedValueOnce([[{ id: 1, email: 'a@b.com' }]]); // SELECT returns a row

    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'u', email: 'a@b.com', password: '12345678' });

    expect(db.execute).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', ['a@b.com']);
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Ya existe un usuario con ese email/);
  });

  test('POST /auth/register con email inválido -> muestra error', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'u', email: 'invalid-email', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/El email no tiene un formato válido/);
  });

  test('POST /auth/register con contraseña corta -> muestra error', async () => {
    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'u', email: 'u@ex.com', password: 'short' });

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/La contraseña debe tener al menos 8 caracteres/);
  });

  test('POST /auth/register exitoso -> redirige a /login', async () => {
    db.execute
      .mockResolvedValueOnce([[]]) // SELECT returns empty
      .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT

    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'nuevo', email: 'new@domain.com', password: 'password123' });

    expect(db.execute).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', [
      'new@domain.com',
    ]);
    expect(db.execute).toHaveBeenCalledWith(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      expect.any(Array)
    );
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('POST /auth/register cuando ocurre error en DB -> muestra página de error', async () => {
    // Simulamos que la base de datos lanza un error (p. ej. caída)
    db.execute.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'u', email: 'u@ex.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/No se pudo crear la cuenta en este momento/);
  });

  test('POST /auth/register si el controlador lanza -> muestra mensaje en la misma página', async () => {
    // Mockeamos el método del controlador para que lance
    const authController = require('../src/controllers/authController');
    const original = authController.register;
    authController.register = jest.fn(() => {
      throw new Error('boom');
    });

    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'u', email: 'u@ex.com', password: 'password123' });

    // Restaurar
    authController.register = original;

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/No se pudo crear la cuenta en este momento/);
  });

  test('POST /auth/register cuando un middleware interno llama next(err) -> muestra mensaje en la misma página', async () => {
    // Mockeamos register para simular que internamente llama next(err)
    const authController = require('../src/controllers/authController');
    const original = authController.register;
    authController.register = jest.fn((req, res, next) => next(new Error('boom')));

    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'u', email: 'u@ex.com', password: 'password123' });

    // Restaurar
    authController.register = original;

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/No se pudo crear la cuenta en este momento/);
  });

  test('POST /auth/register si el controlador hace res.status(500).send("Error en el servidor") -> lo interceptamos y mostramos register', async () => {
    const authController = require('../src/controllers/authController');
    const original = authController.register;
    authController.register = jest.fn((req, res) => res.status(500).send('Error en el servidor'));

    const res = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'u', email: 'u@ex.com', password: 'password123' });

    // Restaurar
    authController.register = original;

    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/No se pudo crear la cuenta en este momento/);
  });
});
