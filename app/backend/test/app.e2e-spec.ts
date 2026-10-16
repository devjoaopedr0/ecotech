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
      RATE_LIMIT_MAX: '10000',
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

  describe('catálogo, culturas e plantas', () => {
    it('busca no catálogo por nome popular ou científico', async () => {
      const { accessToken } = await register('catalogo@exemplo.com');
      const auth = { Authorization: `Bearer ${accessToken}` };

      const byPopular = await http.get('/catalog?q=tom').set(auth);
      expect(byPopular.body.items.map((p: any) => p.popularName)).toEqual(['Tomate']);
      const byScientific = await http.get('/catalog?q=lactuca').set(auth);
      expect(byScientific.body.total).toBe(1);
      expect((await http.get('/catalog?q=a').set(auth)).status).toBe(400);
    });

    it('cria planta pelo catálogo com limites derivados, valida e isola por usuário', async () => {
      const owner = await register('dona@exemplo.com');
      const other = await register('outro@exemplo.com');
      const auth = { Authorization: `Bearer ${owner.accessToken}` };

      const fromCatalog = await http.post('/plants').set(auth).send({ catalogPlantId: '6f8f2a4e-1c1b-4b5e-9a39-3c0f6a1f0001', emoji: '🍅', bed: 'Canteiro 01', plantedAt: '2026-09-20' });
      expect(fromCatalog.status).toBe(201);
      expect(fromCatalog.body).toMatchObject({
        name: 'Tomate',
        species: 'Solanum lycopersicum',
        bed: 'Canteiro 01',
        plantedAt: '2026-09-20',
        humidityCritical: 20,
        humidityLow: 25,
        idealMin: 30,
        idealMax: 70,
        humidityHigh: 80,
        status: null,
        dryingRatePerHour: null,
      });

      const custom = await http.post('/plants').set(auth).send({ name: 'Alface', idealMin: 50, idealMax: 70, humidityCritical: 35 });
      expect(custom.body).toMatchObject({ humidityCritical: 35, humidityLow: 45, humidityHigh: 80 });
      const patched = await http.patch(`/plants/${custom.body.id}`).set(auth).send({ humidityHigh: 90, plantedAt: null });
      expect(patched.body).toMatchObject({ humidityHigh: 90, plantedAt: null });

      const badOrder = await http.post('/plants').set(auth).send({ name: 'X', idealMin: 50, idealMax: 70, humidityCritical: 48 });
      expect(badOrder.status).toBe(400);
      const badPatch = await http.patch(`/plants/${custom.body.id}`).set(auth).send({ idealMax: 95 });
      expect(badPatch.status).toBe(400);
      expect((await http.post('/plants').set(auth).send({ name: 'X' })).status).toBe(400);
      const massAssignment = await http.post('/plants').set(auth).send({ name: 'X', idealMin: 10, idealMax: 20, userId: other.user.id });
      expect(massAssignment.status).toBe(400);

      const foreign = await http.get(`/plants/${fromCatalog.body.id}`).set('Authorization', `Bearer ${other.accessToken}`);
      expect(foreign.status).toBe(404);
      const list = await http.get('/plants').set('Authorization', `Bearer ${other.accessToken}`);
      expect(list.body).toEqual([]);
    });

    it('cadastra culturas e vincula à planta só se for do usuário', async () => {
      const owner = await register('culturas@exemplo.com');
      const other = await register('culturas2@exemplo.com');
      const auth = { Authorization: `Bearer ${owner.accessToken}` };
      const crop = { name: 'Alface', temperatureMin: 15, temperatureMax: 25, lightMin: 10000, lightMax: 25000, irrigationsPerDay: 2, cycleDays: 45 };

      const created = await http.post('/crops').set(auth).send(crop);
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject(crop);
      expect((await http.post('/crops').set(auth).send(crop)).status).toBe(409);
      expect((await http.post('/crops').set(auth).send({ ...crop, name: 'B', lightMin: 30000 })).status).toBe(400);
      const updated = await http.patch(`/crops/${created.body.id}`).set(auth).send({ cycleDays: 50 });
      expect(updated.body.cycleDays).toBe(50);

      const plant = await http.post('/plants').set(auth).send({ name: 'Alface', idealMin: 50, idealMax: 70, cropId: created.body.id });
      expect(plant.body.cropId).toBe(created.body.id);
      const foreign = await http.post('/plants').set('Authorization', `Bearer ${other.accessToken}`).send({ name: 'X', idealMin: 50, idealMax: 70, cropId: created.body.id });
      expect(foreign.status).toBe(404);

      await http.delete(`/crops/${created.body.id}`).set(auth).expect(204);
      expect((await http.get('/crops').set(auth)).body).toEqual([]);
    });
  });

  describe('placas, leituras, irrigação e alertas', () => {
    const setup = async (email: string) => {
      const { accessToken } = await register(email);
      const auth = { Authorization: `Bearer ${accessToken}` };
      const plant = (await http.post('/plants').set(auth).send({ name: 'Alface', bed: 'Canteiro 02', idealMin: 50, idealMax: 70 })).body;
      const device = (await http.post('/devices').set(auth).send({ name: 'Placa 1', plantId: plant.id, depthCm: 10 })).body;
      return { auth, plant, device, sensor: { 'X-Device-Token': device.token } };
    };

    it('fluxo completo da placa no modo automático', async () => {
      const { auth, plant, device, sensor } = await setup('horta@exemplo.com');
      expect(device.token).toMatch(/^etk_/);
      expect(device).not.toHaveProperty('tokenHash');
      expect(device).toMatchObject({ board: 'ESP32', depthCm: 10, online: false, calibration: { rawDry: 3200, rawWet: 1300, isDefault: true } });

      expect((await http.post('/readings').send({ humidity: 50 })).status).toBe(401);
      expect((await http.post('/readings').set({ 'X-Device-Token': 'etk_invalido' }).send({ humidity: 50 })).status).toBe(401);
      expect((await http.post('/readings').set(sensor).send({ humidity: 120 })).status).toBe(400);
      expect((await http.post('/readings').set(sensor).send({})).status).toBe(400);
      expect((await http.post('/readings').set(sensor).send({ humidity: 40, rawValue: 2000 })).status).toBe(400);

      // Modo manual (padrão): a leitura não liga nada.
      const manual = await http.post('/readings').set(sensor).send({ humidity: 30 });
      expect(manual.status).toBe(201);
      expect(manual.body).toMatchObject({ status: 'CRITICAL', irrigation: 'OFF', maxRunSec: null });

      await http.patch(`/plants/${plant.id}/irrigation`).set(auth).send({ mode: 'AUTO', flowRateLpm: 3 }).expect(200);

      const critical = await http.post('/readings').set(sensor).send({ humidity: 35 });
      expect(critical.body).toMatchObject({ status: 'CRITICAL', irrigation: 'ON', maxRunSec: 1200 });
      const low = await http.post('/readings').set(sensor).send({ humidity: 43 });
      expect(low.body).toMatchObject({ status: 'LOW', irrigation: 'ON' });

      const during = await http.get(`/plants/${plant.id}`).set(auth);
      expect(during.body.irrigation).toMatchObject({ isOn: true, flowRateLpm: 3, currentCycle: { source: 'AUTO', humidityBefore: 35, reason: 'Umidade abaixo do nível crítico.' } });

      // Simula 4 minutos de irrigação antes da leitura que fecha o ciclo.
      prisma.irrigationEvent.rows.find((e: any) => e.plantId === plant.id).startedAt = new Date(Date.now() - 4 * 60_000);
      const ideal = await http.post('/readings').set(sensor).send({ humidity: 55 });
      expect(ideal.body).toMatchObject({ status: 'IDEAL', irrigation: 'OFF' });

      const events = await http.get(`/plants/${plant.id}/irrigation/events`).set(auth);
      expect(events.body).toHaveLength(1);
      expect(events.body[0]).toMatchObject({ source: 'AUTO', plantName: 'Alface', bed: 'Canteiro 02', humidityBefore: 35, humidityAfter: 55, durationMin: 4, liters: 12 });

      // Leituras críticas repetidas geram um único alerta crítico (o primeiro segue não lido).
      const alerts = await http.get('/alerts?unread=true').set(auth);
      expect(alerts.body.map((a: any) => a.type).sort()).toEqual(['CRITICAL', 'LOW']);
      const criticalAlert = alerts.body.find((a: any) => a.type === 'CRITICAL');
      expect(criticalAlert).toMatchObject({ plantId: plant.id, value: 30 });
      await http.patch(`/alerts/${criticalAlert.id}/read`).set(auth).expect(200);
      expect((await http.get('/alerts?unread=true').set(auth)).body).toHaveLength(1);

      const stats = await http.get(`/plants/${plant.id}/readings/stats?period=6h`).set(auth);
      expect(stats.body).toMatchObject({ count: 4, current: 55, min: 30, max: 55, amplitude: 25, trend: 'UP', status: 'IDEAL' });
      const history = await http.get(`/plants/${plant.id}/readings/history?period=24h`).set(auth);
      expect(history.body.buckets.reduce((sum: number, b: any) => sum + b.count, 0)).toBe(4);
      expect((await http.get(`/plants/${plant.id}/readings?period=1y`).set(auth)).status).toBe(400);

      const plantView = await http.get(`/plants/${plant.id}`).set(auth);
      expect(plantView.body).toMatchObject({ status: 'IDEAL', latestReading: { humidity: 55 }, irrigation: { mode: 'AUTO', isOn: false, currentCycle: null } });
      const deviceView = await http.get(`/devices/${device.id}`).set(auth);
      expect(deviceView.body).toMatchObject({ online: true, latestReading: { humidity: 55 } });

      // Token rotacionado: o antigo para de funcionar.
      const rotated = await http.post(`/devices/${device.id}/token`).set(auth);
      expect((await http.post('/readings').set(sensor).send({ humidity: 50 })).status).toBe(401);
      expect((await http.post('/readings').set({ 'X-Device-Token': rotated.body.token }).send({ humidity: 50 })).status).toBe(201);
    });

    it('converte o valor bruto pela calibração e valida a escala da placa', async () => {
      const { auth, device, sensor } = await setup('calibra@exemplo.com');

      const standard = await http.post('/readings').set(sensor).send({ rawValue: 2250 });
      expect(standard.body.humidity).toBe(50);

      expect((await http.put(`/devices/${device.id}/calibration`).set(auth).send({ board: 'ARDUINO', rawDry: 3200, rawWet: 1300 })).status).toBe(400);
      const calibrated = await http.put(`/devices/${device.id}/calibration`).set(auth).send({ board: 'ARDUINO', rawDry: 800, rawWet: 300 });
      expect(calibrated.body).toMatchObject({ board: 'ARDUINO', calibration: { rawDry: 800, rawWet: 300, isDefault: false } });

      expect((await http.post('/readings').set(sensor).send({ rawValue: 2000 })).status).toBe(400);
      const arduino = await http.post('/readings').set(sensor).send({ rawValue: 550 });
      expect(arduino.body.humidity).toBe(50);

      const collected = await http
        .get('/readings')
        .query({ from: new Date(Date.now() - 3600_000).toISOString(), to: new Date(Date.now() + 1000).toISOString() })
        .set(auth);
      expect(collected.body.map((r: any) => [r.rawValue, r.humidity, r.deviceName])).toEqual([
        [550, 50, 'Placa 1'],
        [2250, 50, 'Placa 1'],
      ]);
    });

    it('irrigação manual com duração e bloqueio do automático após parar no crítico', async () => {
      const { auth, plant, sensor } = await setup('manual@exemplo.com');
      await http.post('/readings').set(sensor).send({ humidity: 38 });

      const on = await http.post(`/plants/${plant.id}/irrigation`).set(auth).send({ on: true, durationMin: 5 });
      expect(on.body).toMatchObject({ mode: 'MANUAL', isOn: true });
      expect((await http.post(`/plants/${plant.id}/irrigation`).set(auth).send({ on: true, durationMin: 0 })).status).toBe(400);

      const running = await http.post('/readings').set(sensor).send({ humidity: 39 });
      expect(running.body.irrigation).toBe('ON');
      expect(running.body.maxRunSec).toBeGreaterThan(290);

      // A duração pedida terminou: a próxima leitura desliga.
      prisma.irrigationEvent.rows.find((e: any) => e.plantId === plant.id).startedAt = new Date(Date.now() - 5 * 60_000);
      expect((await http.post('/readings').set(sensor).send({ humidity: 39 })).body.irrigation).toBe('OFF');

      // No automático, desligar com o solo crítico bloqueia o religamento até sair do crítico.
      await http.patch(`/plants/${plant.id}/irrigation`).set(auth).send({ mode: 'AUTO' }).expect(200);
      expect((await http.post('/readings').set(sensor).send({ humidity: 38 })).body.irrigation).toBe('ON');
      const off = await http.post(`/plants/${plant.id}/irrigation`).set(auth).send({ on: false });
      expect(off.body).toMatchObject({ isOn: false, autoBlocked: true });
      expect((await http.post('/readings').set(sensor).send({ humidity: 37 })).body.irrigation).toBe('OFF');
      expect((await http.post('/readings').set(sensor).send({ humidity: 41 })).body.irrigation).toBe('OFF');
      expect((await http.get(`/plants/${plant.id}/irrigation`).set(auth)).body.autoBlocked).toBe(false);
      expect((await http.post('/readings').set(sensor).send({ humidity: 38 })).body.irrigation).toBe('ON');

      const all = await http
        .get('/irrigation/events')
        .query({ from: new Date(Date.now() - 3600_000).toISOString(), to: new Date(Date.now() + 1000).toISOString() })
        .set(auth);
      expect(all.body.map((e: any) => [e.source, e.plannedDurationMin])).toEqual([
        ['AUTO', null],
        ['AUTO', null],
        ['MANUAL', 5],
      ]);
    });

    it('placa sem planta: aceita ambiente, recusa umidade e alerta reservatório baixo', async () => {
      const { auth } = await setup('ambiente@exemplo.com');
      const loose = (await http.post('/devices').set(auth).send({ name: 'Reservatório' })).body;
      const token = { 'X-Device-Token': loose.token };

      expect((await http.post('/readings').set(token).send({ humidity: 50 })).status).toBe(409);
      const env = await http.post('/readings').set(token).send({ waterLevel: 15, temperature: 33 });
      expect(env.status).toBe(201);
      expect(env.body).toMatchObject({ plantId: null, humidity: null, status: null, irrigation: 'OFF' });

      const alerts = (await http.get('/alerts').set(auth)).body;
      expect(alerts.map((a: any) => [a.type, a.deviceId, a.value]).sort()).toEqual([
        ['HIGH_TEMPERATURE', loose.id, 33],
        ['RESERVOIR_LOW', loose.id, 15],
      ]);
    });

    it('relatório de água por dia com economia e custo', async () => {
      const { auth, plant, sensor } = await setup('relatorio@exemplo.com');
      await http.post('/readings').set(sensor).send({ humidity: 30 });
      await http.post(`/plants/${plant.id}/irrigation`).set(auth).send({ on: true });
      prisma.irrigationEvent.rows.find((e: any) => e.plantId === plant.id).startedAt = new Date(Date.now() - 3 * 60_000);
      await http.post(`/plants/${plant.id}/irrigation`).set(auth).send({ on: false });

      const from = new Date(Date.now() - 2 * 3600_000).toISOString();
      const to = new Date(Date.now() + 3600_000).toISOString();
      const report = await http.get('/reports/water').query({ from, to, tz: 'UTC' }).set(auth);
      expect(report.status).toBe(200);
      expect(report.body.tariffPerM3).toBe(6.48);
      const usedTotal = report.body.days.reduce((s: number, d: any) => s + d.usedLiters, 0);
      expect(usedTotal).toBe(6);
      expect(report.body.summary).toMatchObject({ usedLiters: 6 });
      expect(report.body.days.some((d: any) => d.criticalPlants === 1 && d.alerts === 1)).toBe(true);

      expect((await http.get('/reports/water').query({ from, to, tz: 'Marte/Base' }).set(auth)).status).toBe(400);
      expect((await http.get('/reports/water').query({ from: to, to: from }).set(auth)).status).toBe(400);
    });
  });
});
