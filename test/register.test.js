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
});
