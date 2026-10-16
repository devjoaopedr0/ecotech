import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFakePrisma } from './fake-prisma';

// Sobe a aplicação inteira (guards, pipes, filtro global, controllers) com o
// PrismaService trocado por um fake em memória, e testa via HTTP.
describe('EcoTech API (e2e)', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createFakePrisma>;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    Object.assign(process.env, {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/unused',
      PORT: '3999',
      CORS_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'test-secret-para-os-testes-e2e-000',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret-para-os-testes',
      JWT_REFRESH_EXPIRES_IN: '7d',
    });

    // Import dinâmico depois de definir as envs: o ConfigModule as valida
    // quando o AppModule é avaliado.
    const { AppModule } = await import('../src/app.module');
    const { PrismaService } = await import('../src/database/prisma.service');

    prisma = createFakePrisma();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    http = request(app.getHttpServer());

    prisma.plantCatalog.rows.push(
      { id: '6f8f2a4e-1c1b-4b5e-9a39-3c0f6a1f0001', popularName: 'Tomate', scientificName: 'Solanum lycopersicum', humidityMin: 30, humidityMax: 70, createdAt: new Date() },
      { id: '6f8f2a4e-1c1b-4b5e-9a39-3c0f6a1f0002', popularName: 'Alface', scientificName: 'Lactuca sativa', humidityMin: 40, humidityMax: 80, createdAt: new Date() },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const register = async (email: string) => {
    const res = await http.post('/auth/register').send({ name: 'Maria Silva', email, password: 'SenhaForte123' });
    expect(res.status).toBe(201);
    return res.body as { accessToken: string; refreshToken: string; user: { id: string } };
  };

  describe('auth', () => {
    it('cadastra, faz login, devolve /me e não expõe o hash', async () => {
      const { accessToken, user } = await register('Maria@Exemplo.com');
      expect(user).not.toHaveProperty('passwordHash');

      const dup = await http.post('/auth/register').send({ name: 'Outra', email: 'maria@exemplo.com', password: 'SenhaForte123' });
      expect(dup.status).toBe(409);

      const login = await http.post('/auth/login').send({ email: 'maria@exemplo.com', password: 'SenhaForte123' });
      expect(login.status).toBe(200);

      const wrong = await http.post('/auth/login').send({ email: 'maria@exemplo.com', password: 'errada123' });
      expect(wrong.status).toBe(401);

      const me = await http.get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
      expect(me.status).toBe(200);
      expect(me.body.email).toBe('maria@exemplo.com');
    });

    it('troca a senha e invalida os tokens antigos', async () => {
      const session = await register('troca@exemplo.com');
      const changed = await http
        .patch('/auth/password')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({ currentPassword: 'SenhaForte123', newPassword: 'NovaSenha456' });
      expect(changed.status).toBe(200);

      const old = await http.get('/auth/me').set('Authorization', `Bearer ${session.accessToken}`);
      expect(old.status).toBe(401);
      const refreshOld = await http.post('/auth/refresh').send({ refreshToken: session.refreshToken });
      expect(refreshOld.status).toBe(401);

      const fresh = await http.get('/auth/me').set('Authorization', `Bearer ${changed.body.accessToken}`);
      expect(fresh.status).toBe(200);
    });

    it('rejeita rotas protegidas sem token', async () => {
      expect((await http.get('/plants')).status).toBe(401);
    });
  });

  describe('catálogo e plantas', () => {
    it('busca no catálogo por nome popular ou científico', async () => {
      const { accessToken } = await register('catalogo@exemplo.com');
      const auth = { Authorization: `Bearer ${accessToken}` };

      const byPopular = await http.get('/catalog?q=tom').set(auth);
      expect(byPopular.body.items.map((p: any) => p.popularName)).toEqual(['Tomate']);
      const byScientific = await http.get('/catalog?q=lactuca').set(auth);
      expect(byScientific.body.total).toBe(1);
      expect((await http.get('/catalog?q=a').set(auth)).status).toBe(400);
    });

    it('cria planta pelo catálogo, valida faixa e isola por usuário', async () => {
      const owner = await register('dona@exemplo.com');
      const other = await register('outro@exemplo.com');
      const auth = { Authorization: `Bearer ${owner.accessToken}` };

      const fromCatalog = await http.post('/plants').set(auth).send({ catalogPlantId: '6f8f2a4e-1c1b-4b5e-9a39-3c0f6a1f0001', emoji: '🍅' });
      expect(fromCatalog.status).toBe(201);
      expect(fromCatalog.body).toMatchObject({ name: 'Tomate', species: 'Solanum lycopersicum', humidityMin: 30, humidityMax: 70, status: null });

      const badRange = await http.post('/plants').set(auth).send({ name: 'X', humidityMin: 70, humidityMax: 30 });
      expect(badRange.status).toBe(400);
      const missing = await http.post('/plants').set(auth).send({ name: 'X' });
      expect(missing.status).toBe(400);
      const massAssignment = await http.post('/plants').set(auth).send({ name: 'X', humidityMin: 1, humidityMax: 2, userId: other.user.id });
      expect(massAssignment.status).toBe(400);

      const foreign = await http.get(`/plants/${fromCatalog.body.id}`).set('Authorization', `Bearer ${other.accessToken}`);
      expect(foreign.status).toBe(404);
      const list = await http.get('/plants').set('Authorization', `Bearer ${other.accessToken}`);
      expect(list.body).toEqual([]);
    });
  });

  describe('sensor, leituras, irrigação e alertas', () => {
    it('fluxo completo do ESP32 no modo automático', async () => {
      const { accessToken } = await register('horta@exemplo.com');
      const auth = { Authorization: `Bearer ${accessToken}` };

      const plant = (await http.post('/plants').set(auth).send({ name: 'Alface', humidityMin: 40, humidityMax: 80 })).body;
      const device = await http.post('/devices').set(auth).send({ name: 'Sensor 1', plantId: plant.id });
      expect(device.status).toBe(201);
      expect(device.body.token).toMatch(/^etk_/);
      expect(device.body).not.toHaveProperty('tokenHash');
      const sensor = { 'X-Device-Token': device.body.token };

      expect((await http.post('/readings').send({ humidity: 50 })).status).toBe(401);
      expect((await http.post('/readings').set({ 'X-Device-Token': 'etk_invalido' }).send({ humidity: 50 })).status).toBe(401);
      expect((await http.post('/readings').set(sensor).send({ humidity: 120 })).status).toBe(400);

      // Modo manual (padrão): a leitura não liga nada.
      const manual = await http.post('/readings').set(sensor).send({ humidity: 30 });
      expect(manual.status).toBe(201);
      expect(manual.body).toMatchObject({ status: 'LOW', irrigation: 'OFF' });

      await http.patch(`/plants/${plant.id}/irrigation/mode`).set(auth).send({ mode: 'AUTO' }).expect(200);

      const low = await http.post('/readings').set(sensor).send({ humidity: 35 });
      expect(low.body).toMatchObject({ status: 'LOW', irrigation: 'ON' });
      const attention = await http.post('/readings').set(sensor).send({ humidity: 43 });
      expect(attention.body).toMatchObject({ status: 'ATTENTION', irrigation: 'ON' });
      const ideal = await http.post('/readings').set(sensor).send({ humidity: 55 });
      expect(ideal.body).toMatchObject({ status: 'IDEAL', irrigation: 'OFF' });

      const events = await http.get(`/plants/${plant.id}/irrigation/events`).set(auth);
      expect(events.body).toHaveLength(1);
      expect(events.body[0]).toMatchObject({ source: 'AUTO' });
      expect(events.body[0].endedAt).not.toBeNull();

      // Duas leituras LOW geraram um único alerta (o primeiro segue não lido).
      const alerts = await http.get('/alerts?unread=true').set(auth);
      expect(alerts.body).toHaveLength(1);
      expect(alerts.body[0]).toMatchObject({ type: 'LOW', plantId: plant.id });
      await http.patch(`/alerts/${alerts.body[0].id}/read`).set(auth).expect(200);
      expect((await http.get('/alerts?unread=true').set(auth)).body).toHaveLength(0);
      expect((await http.get('/alerts?unread=false').set(auth)).body).toHaveLength(1);

      const stats = await http.get(`/plants/${plant.id}/readings/stats?period=6h`).set(auth);
      expect(stats.body).toMatchObject({ count: 4, current: 55, min: 30, max: 55, amplitude: 25, trend: 'UP', status: 'IDEAL' });

      const history = await http.get(`/plants/${plant.id}/readings/history?period=24h`).set(auth);
      expect(history.status).toBe(200);
      expect(history.body.buckets.reduce((sum: number, b: any) => sum + b.count, 0)).toBe(4);
      expect((await http.get(`/plants/${plant.id}/readings?period=1y`).set(auth)).status).toBe(400);

      const plantView = await http.get(`/plants/${plant.id}`).set(auth);
      expect(plantView.body).toMatchObject({ status: 'IDEAL', latestReading: { humidity: 55 }, irrigation: { mode: 'AUTO', isOn: false } });

      // Token rotacionado: o antigo para de funcionar.
      const rotated = await http.post(`/devices/${device.body.id}/token`).set(auth);
      expect((await http.post('/readings').set(sensor).send({ humidity: 50 })).status).toBe(401);
      expect((await http.post('/readings').set({ 'X-Device-Token': rotated.body.token }).send({ humidity: 50 })).status).toBe(201);
    });

    it('liga e desliga manualmente e recusa sensor sem planta', async () => {
      const { accessToken } = await register('manual@exemplo.com');
      const auth = { Authorization: `Bearer ${accessToken}` };
      const plant = (await http.post('/plants').set(auth).send({ name: 'Manjericão', humidityMin: 40, humidityMax: 70 })).body;

      const on = await http.post(`/plants/${plant.id}/irrigation`).set(auth).send({ on: true });
      expect(on.body).toMatchObject({ mode: 'MANUAL', isOn: true });
      await http.post(`/plants/${plant.id}/irrigation`).set(auth).send({ on: false }).expect(201);
      const events = await http.get(`/plants/${plant.id}/irrigation/events`).set(auth);
      expect(events.body).toHaveLength(1);
      expect(events.body[0].source).toBe('MANUAL');

      const loose = await http.post('/devices').set(auth).send({ name: 'Solto' });
      const res = await http.post('/readings').set({ 'X-Device-Token': loose.body.token }).send({ humidity: 50 });
      expect(res.status).toBe(409);
    });
  });
});
