const request = require('supertest');
const { resetDb, registerUser, loginUser } = require('./helpers');
const app = require('../server');

let vetToken, assistantToken, adminToken, animalId;

beforeAll(async () => {
  await resetDb();
  const vet = await registerUser('vet', 'Vet User 2', 'vet2@test.local');
  const admin = await registerUser('admin', 'Admin User 2', 'admin3@test.local');
  const assistant = await registerUser('assistant', 'Assist User 3', 'assist3@test.local');

  vetToken = await loginUser(vet.email);
  adminToken = await loginUser(admin.email);
  assistantToken = await loginUser(assistant.email);

  // assistant creates an animal
  const res = await request(app)
    .post('/api/animals')
    .set('Authorization', `Bearer ${assistantToken}`)
    .send({ name: 'Spot', species: 'Dog' });
  animalId = res.body.id;
});

describe('Markers CRUD', () => {
  let markerId;

  test('vet can create a marker for an animal', async () => {
    const res = await request(app)
      .post(`/api/animals/${animalId}/markers`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ height: 30, weight: 10, diet: 'Kibble', vaccines: true, status: 'not started' });

    expect(res.status).toBe(201);
    expect(res.body.marker).toHaveProperty('id');
    markerId = res.body.marker.id;
  });

  test('vet cannot create a second marker for the same animal', async () => {
    const res = await request(app)
      .post(`/api/animals/${animalId}/markers`)
      .set('Authorization', `Bearer ${vetToken}`)
      .send({ height: 31, weight: 11, diet: 'Kibble2', vaccines: false, status: 'started' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Health marker for animal already exists, must update');
  });

  test('assistant can read their animal marker', async () => {
    const res = await request(app)
      .get(`/api/animals/${animalId}/markers`)
      .set('Authorization', `Bearer ${assistantToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  test('assistant cannot create a marker', async () => {
    const res = await request(app)
      .post(`/api/animals/${animalId}/markers`)
      .set('Authorization', `Bearer ${assistantToken}`)
      .send({ height: 1 });

    expect(res.status).toBe(403);
  });

  test('admin deleting the animal removes its marker', async () => {
    const res = await request(app)
      .delete(`/api/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const getMarker = await request(app)
      .get(`/api/animals/${animalId}/markers`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getMarker.status).toBe(404);
  });
});
