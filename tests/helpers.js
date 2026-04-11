const request = require('supertest');
const app = require('../server');
const { db } = require('../database/setup');

async function resetDb() {
  await db.sync({ force: true });
}

async function registerUser(role = 'assistant', name = `User ${Date.now()}`, email) {
  const userEmail = email || `${role}${Date.now()}@test.local`;
  const res = await request(app)
    .post('/api/register')
    .send({ name, email: userEmail, password: 'password', role });
  return res.body.caretaker;
}

async function loginUser(email, password = 'password') {
  const res = await request(app)
    .post('/api/login')
    .send({ email, password });
  return res.body.token;
}

module.exports = { request, app, db, resetDb, registerUser, loginUser };
