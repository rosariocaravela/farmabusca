const test = require('node:test');
const assert = require('node:assert/strict');
const { haversineDistanceMeters, rankByProximity, validateCoordinates } = require('../src/utils/geo');

test('aceita coordenadas válidas e converte strings numéricas', () => {
  assert.deepEqual(validateCoordinates('-25.9692', '32.5732'), { latitude: -25.9692, longitude: 32.5732 });
});

test('ordena farmácias por proximidade e aplica raio', () => {
  const origin = { latitude: -25.9687, longitude: 32.5732 };
  const medicines = [
    { id: 'far', price: 100, Pharmacy: { name: 'Longe', latitude: -25.9576, longitude: 32.571 } },
    { id: 'near', price: 120, Pharmacy: { name: 'Perto', latitude: -25.96925, longitude: 32.57314 } },
    { id: 'unknown', price: 80, Pharmacy: { name: 'Sem coordenadas' } },
  ];
  const ordered = rankByProximity(medicines, origin);
  assert.deepEqual(ordered.map((item) => item.id), ['near', 'far', 'unknown']);
  assert.ok(ordered[0].distanceMeters < ordered[1].distanceMeters);
  assert.equal(ordered[2].distanceMeters, null);
  assert.deepEqual(rankByProximity(medicines, origin, { radiusKm: 1 }).map((item) => item.id), ['near']);
});

test('rejeita coordenadas inválidas, vazias ou não numéricas', () => {
  assert.throws(() => validateCoordinates(-91, 32), /Latitude/);
  assert.throws(() => validateCoordinates(-25, 181), /Longitude/);
  assert.throws(() => validateCoordinates('inválida', 32), /números/);
  assert.throws(() => validateCoordinates(-25, ''), /números/);
});

test('calcula distância Haversine conhecida com tolerância', () => {
  const distance = haversineDistanceMeters({ latitude: -25.9692, longitude: 32.5732 }, { latitude: -25.9615, longitude: 32.5801 });
  assert.ok(distance > 1000 && distance < 1200);
});
