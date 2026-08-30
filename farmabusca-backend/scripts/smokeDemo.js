const fs = require('fs');
const path = require('path');

const baseUrl = process.env.SMOKE_API_URL || 'http://127.0.0.1:5000/api';
const credentialsPath = path.resolve(__dirname, '..', 'demo-credentials.local.txt');

const readCredentials = () => {
  const lines = fs.readFileSync(credentialsPath, 'utf8').split(/\r?\n/);
  const result = {};
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(PATIENT|PHARMACY|ADMIN):\s+(.+)$/);
    if (match && lines[index + 1]?.startsWith('Palavra-passe: ')) {
      const key = match[1] === 'PHARMACY' && result.PHARMACY ? 'PHARMACY_SECOND' : match[1];
      result[key] = { email: match[2], password: lines[index + 1].slice('Palavra-passe: '.length) };
    }
  }
  return result;
};

const request = async (route, options = {}) => {
  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}), ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  return { status: response.status, payload };
};

const login = async (credentials) => {
  const result = await request('/auth/login', { method: 'POST', body: credentials });
  if (result.status !== 200) throw new Error(`Login failed with status ${result.status}`);
  return result.payload.data;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
};

async function run() {
  const credentials = readCredentials();
  const patient = await login(credentials.PATIENT);
  const pharmacy = await login(credentials.PHARMACY);
  const admin = await login(credentials.ADMIN);
  assert(patient.user.role === 'PATIENT' && pharmacy.user.role === 'PHARMACY' && admin.user.role === 'ADMIN', 'login redirects have the expected roles');

  const publicMedicines = await request('/medicines');
  assert(publicMedicines.status === 200 && publicMedicines.payload.data.length >= 10, 'public search returns demo medicines, including availability states');
  assert(publicMedicines.payload.data.some((item) => item.stockStatus === 'OUT_OF_STOCK'), 'out-of-stock medicine is visible to patients');
  const filteredSearch = await request('/medicines?location=Maputo&maxPrice=100&stockStatus=AVAILABLE&sort=price_asc');
  assert(filteredSearch.status === 200 && filteredSearch.payload.data.length > 0 && filteredSearch.payload.data.every((item) => Number(item.price) <= 100 && item.stockStatus === 'AVAILABLE'), 'search filters location, price and availability on the server');
  const nearOrigin = '/medicines/search?name=Paracetamol&latitude=-25.9687&longitude=32.5732&sort=distance';
  const proximity = await request(nearOrigin);
  assert(proximity.status === 200 && proximity.payload.data.length === 2 && proximity.payload.data[0].distanceMeters < proximity.payload.data[1].distanceMeters, 'proximity search returns calculated distances in ascending order');
  const radiusOne = await request(`${nearOrigin}&radiusKm=1`);
  const radiusThree = await request(`${nearOrigin}&radiusKm=3`);
  assert(radiusOne.payload.data.length === 1 && radiusThree.payload.data.length === 2, 'proximity radius filters results at 1 km and 3 km');
  const withoutGps = await request('/medicines/search?name=Paracetamol');
  const invalidGps = await request('/medicines/search?name=Paracetamol&latitude=91&longitude=32');
  assert(withoutGps.status === 200 && withoutGps.payload.data.every((item) => item.distanceMeters === null) && invalidGps.status === 400, 'search remains usable without GPS and rejects invalid coordinates');

  const pharmacies = await request('/pharmacies');
  const nestedUser = pharmacies.payload.data?.[0]?.User || {};
  assert(!('password' in nestedUser) && !('resetPasswordToken' in nestedUser), 'public pharmacy response excludes authentication secrets');
  const pharmacyId = pharmacies.payload.data[0].id;
  await request('/favorites/pharmacies', { method: 'POST', token: patient.token, body: { pharmacyId } });
  const pharmacyFavorites = await request('/favorites/pharmacies', { token: patient.token });
  assert(pharmacyFavorites.status === 200 && pharmacyFavorites.payload.data.some((item) => item.pharmacyId === pharmacyId), 'patient can persist a pharmacy favorite');
  const removedPharmacyFavorite = await request(`/favorites/pharmacies/${pharmacyId}`, { method: 'DELETE', token: patient.token });
  assert(removedPharmacyFavorite.status === 200, 'patient can remove a pharmacy favorite');

  const noToken = await request('/admin/users');
  const invalidToken = await request('/admin/users', { token: 'invalid-token' });
  const wrongRole = await request('/admin/users', { token: patient.token });
  assert(noToken.status === 401 && invalidToken.status === 401 && wrongRole.status === 403, 'protected route rejects missing, invalid and wrong-role tokens');
  const assistantNoToken = await request('/assistant', { method: 'POST', body: { message: 'Onde encontro Paracetamol?' } });
  const assistantWrongRole = await request('/assistant', { method: 'POST', token: pharmacy.token, body: { message: 'Onde encontro Paracetamol?' } });
  const medicalBoundary = await request('/assistant', { method: 'POST', token: patient.token, body: { message: 'Qual medicamento devo tomar e qual dose?' } });
  assert(assistantNoToken.status === 401 && assistantWrongRole.status === 403, 'assistant endpoint is restricted to authenticated patients');
  assert(medicalBoundary.status === 200 && medicalBoundary.payload.data.safety === 'MEDICAL_BOUNDARY' && medicalBoundary.payload.data.results.length === 0, 'assistant refuses diagnosis, prescription and treatment decisions without consulting AI');

  const users = await request('/admin/users', { token: admin.token });
  assert(users.status === 200 && users.payload.data.every((user) => !('password' in user)), 'admin user list is sanitized');
  const pendingPharmacies = await request('/admin/pharmacies?status=pending', { token: admin.token });
  const pendingPharmacy = pendingPharmacies.payload.data?.[0];
  const rejected = await request(`/admin/pharmacies/${pendingPharmacy.id}/status`, { method: 'PUT', token: admin.token, body: { action: 'reject' } });
  const rejectedList = await request('/admin/pharmacies?status=rejected', { token: admin.token });
  assert(rejected.status === 200 && rejectedList.payload.data.some((item) => item.id === pendingPharmacy.id), 'admin can reject a pharmacy with a distinct review status');
  const publicApproved = pharmacies.payload.data[0];
  const suspendedPharmacy = await request(`/admin/pharmacies/${publicApproved.id}/status`, { method: 'PUT', token: admin.token, body: { action: 'suspend' } });
  const hiddenSuspended = await request(`/pharmacies/${publicApproved.id}`);
  const reapprovedPharmacy = await request(`/admin/pharmacies/${publicApproved.id}/status`, { method: 'PUT', token: admin.token, body: { action: 'approve' } });
  assert(suspendedPharmacy.status === 200 && hiddenSuspended.status === 404 && reapprovedPharmacy.status === 200, 'admin can suspend and reactivate an approved pharmacy');

  const myMedicines = await request('/pharmacies/me/medicines', { token: pharmacy.token });
  const ownMedicine = myMedicines.payload.data?.[0];
  const otherMedicine = publicMedicines.payload.data.find((item) => item.pharmacyId !== ownMedicine.pharmacyId);
  const forbiddenUpdate = await request(`/medicines/${otherMedicine.id}`, { method: 'PUT', token: pharmacy.token, body: { price: Number(otherMedicine.price) + 1 } });
  assert(forbiddenUpdate.status === 403, 'pharmacy cannot modify another pharmacy medicine');

  const originalPrice = Number(ownMedicine.price);
  const changedPrice = originalPrice + 3;
  const ownUpdate = await request(`/medicines/${ownMedicine.id}`, { method: 'PUT', token: pharmacy.token, body: { price: changedPrice, quantity: 9, stockStatus: 'AVAILABLE' } });
  const patientView = await request(`/medicines/${ownMedicine.id}`);
  assert(ownUpdate.status === 200 && Number(patientView.payload.data.price) === changedPrice && patientView.payload.data.quantity === 9, 'pharmacy price and availability update is immediately visible to patients');
  await request(`/medicines/${ownMedicine.id}`, { method: 'PUT', token: pharmacy.token, body: { price: originalPrice, quantity: ownMedicine.quantity, stockStatus: ownMedicine.stockStatus } });

  const createdMedicine = await request('/medicines', { method: 'POST', token: pharmacy.token, body: { name: 'Medicamento Fluxo P1', category: 'Demonstração', price: 77, quantity: 4 } });
  assert(createdMedicine.status === 201, 'pharmacy can create a medicine');
  const createdId = createdMedicine.payload.data.id;
  const editedMedicine = await request(`/medicines/${createdId}`, { method: 'PUT', token: pharmacy.token, body: { price: 79, quantity: 0, stockStatus: 'OUT_OF_STOCK' } });
  assert(editedMedicine.status === 200 && editedMedicine.payload.data.stockStatus === 'OUT_OF_STOCK', 'pharmacy can edit price and mark a medicine out of stock');
  const deactivatedMedicine = await request(`/medicines/${createdId}`, { method: 'DELETE', token: pharmacy.token });
  const hiddenMedicine = await request(`/medicines/${createdId}`);
  assert(deactivatedMedicine.status === 200 && hiddenMedicine.status === 404, 'pharmacy can deactivate a medicine and it disappears from patient search');

  const ownPharmacy = await request('/pharmacies/me', { token: pharmacy.token });
  const originalDescription = ownPharmacy.payload.data.description || '';
  const profileUpdate = await request('/pharmacies/me', { method: 'PUT', token: pharmacy.token, body: { description: 'Perfil comercial actualizado pelo teste P1.' } });
  const publicProfile = await request(`/pharmacies/${ownPharmacy.payload.data.id}`);
  assert(profileUpdate.status === 200 && publicProfile.payload.data.description === 'Perfil comercial actualizado pelo teste P1.', 'commercial pharmacy profile update is visible to patients');
  await request('/pharmacies/me', { method: 'PUT', token: pharmacy.token, body: { description: originalDescription } });

  const suspend = await request(`/admin/users/${patient.user.id}/status`, { method: 'PUT', token: admin.token, body: { isActive: false } });
  const suspendedLogin = await request('/auth/login', { method: 'POST', body: credentials.PATIENT });
  assert(suspend.status === 200 && suspendedLogin.status === 403, 'suspended user cannot sign in');
  const activate = await request(`/admin/users/${patient.user.id}/status`, { method: 'PUT', token: admin.token, body: { isActive: true } });
  assert(activate.status === 200, 'test user is restored after suspension test');
  const auditLogs = await request('/admin/audit-logs', { token: admin.token });
  assert(auditLogs.status === 200 && auditLogs.payload.data.some((log) => log.action === 'USER_SUSPENDED'), 'critical admin action is recorded in the audit log');
}

run().catch((error) => {
  console.error('SMOKE TEST FAILED:', error.message);
  process.exit(1);
});
