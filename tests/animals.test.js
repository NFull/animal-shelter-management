const { request, resetDb, registerUser, loginUser } = require('./helpers');

let adminToken, assistantToken, assistant;

beforeAll(async () => {
  await resetDb();
  const admin = await registerUser('admin', 'Admin User', 'admin@test.local');
  assistant = await registerUser('assistant', 'Assist User', 'assist@test.local');
  adminToken = await loginUser(admin.email);
  assistantToken = await loginUser(assistant.email);
});

describe('Animals CRUD', () => {
  let animalId;

  test('assistant can create an animal', async () => {
    const res = await request(require('../server'))
      .post('/api/animals')
      .set('Authorization', `Bearer ${assistantToken}`)
      .send({ name: 'Buddy', species: 'Dog' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    animalId = res.body.id;
  });

  test('admin can list all animals', async () => {
    const res = await request(require('../server'))
      .get('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.animals)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  test('assistant can update their animal', async () => {
    const res = await request(require('../server'))
      .put(`/api/animals/${animalId}`)
      .set('Authorization', `Bearer ${assistantToken}`)
      .send({ breed: 'Beagle' });

    expect(res.status).toBe(200);
    expect(res.body.animal.breed).toBe('Beagle');
  });

  test('assistant cannot delete an animal (admin only)', async () => {
    const res = await request(require('../server'))
      .delete(`/api/animals/${animalId}`)
      .set('Authorization', `Bearer ${assistantToken}`);

    expect(res.status).toBe(403);
  });

  test('admin can delete an animal', async () => {
    const res = await request(require('../server'))
      .delete(`/api/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
