const request = require('supertest');
const app = require('../app');

test('GET /login -> 200', async () => {
  const res = await request(app).get('/login');
  expect(res.statusCode).toBe(200);
});
