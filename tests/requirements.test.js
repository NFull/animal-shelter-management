const request = require('supertest');
const { resetDb, registerUser, loginUser } = require('./helpers');
const app = require('../server');

let vetToken, assistantToken, adminToken, animalId;

beforeAll(async () => {
  await resetDb();
  const vet = await registerUser('vet', 'Vet User', 'vet@test.local');
  const admin = await registerUser('admin', 'Admin User', 'admin2@test.local');
  const assistant = await registerUser('assistant', 'Assist User 2', 'assist2@test.local');

  vetToken = await loginUser(vet.email);
  adminToken = await loginUser(admin.email);
  assistantToken = await loginUser(assistant.email);

  // assistant creates an animal
  const res = await request(app)
    .post('/api/animals')
    .set('Authorization', `Bearer ${assistantToken}`)
    .send({ name: 'Mittens', species: 'Cat' });
  animalId = res.body.id;
});

describe('Requirements CRUD', () => {
  let requirementId;

  test('vet can create a requirement for an animal', async () => {
    const res = await request(app)
      .post(`/api/animals/${animalId}/requirements`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ medications: 'Med A', careOutline: 'Do X', quarantine: true });

    expect(res.status).toBe(201);
    expect(res.body.requirement).toHaveProperty('id');
    requirementId = res.body.requirement.id;
  });

  test('vet cannot create a second requirement for the same animal', async () => {
    const res = await request(app)
      .post(`/api/animals/${animalId}/requirements`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ medications: 'Med B', careOutline: 'Do Y', quarantine: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Health requirement for animal already exists, must update');
  });

  test('assistant can read their animal requirement', async () => {
    const res = await request(app)
      .get(`/api/animals/${animalId}/requirements`)
      .set('Authorization', `Bearer ${assistantToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  test('assistant cannot create a requirement', async () => {
    const res = await request(app)
      .post(`/api/animals/${animalId}/requirements`)
      .set('Authorization', `Bearer ${assistantToken}`)
      .send({ medications: 'X' });

    expect(res.status).toBe(403);
  });

  test('admin deleting the animal removes its requirement', async () => {
    const res = await request(app)
      .delete(`/api/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const getReq = await request(app)
      .get(`/api/animals/${animalId}/requirements`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getReq.status).toBe(404);
  });
});
