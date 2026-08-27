require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sequelize, User, Pharmacy, Category, Medicine } = require('../src/models');

const passwordFor = (key) => process.env[key] || crypto.randomBytes(12).toString('base64url');
const accounts = [
  { key: 'patient', name: 'Amélia Mucavele', email: process.env.DEMO_PATIENT_EMAIL || 'paciente.demo@example.test', password: passwordFor('DEMO_PATIENT_PASSWORD'), phone: '841110001', role: 'PATIENT', image: '/demo-assets/user-patient.png' },
  { key: 'approved', name: 'Gestor Farmácia Baixa', email: process.env.DEMO_PHARMACY_EMAIL || 'farmacia.demo@example.test', password: passwordFor('DEMO_PHARMACY_PASSWORD'), phone: '841110002', role: 'PHARMACY', image: '/demo-assets/user-pharmacy-baixa.png' },
  { key: 'pending', name: 'Gestora Farmácia Esperança', email: process.env.DEMO_PENDING_PHARMACY_EMAIL || 'farmacia.pendente@example.test', password: passwordFor('DEMO_PENDING_PHARMACY_PASSWORD'), phone: '841110003', role: 'PHARMACY', image: '/demo-assets/user-pharmacy-pending.png' },
  { key: 'second', name: 'Gestor Farmácia Matola', email: process.env.DEMO_SECOND_PHARMACY_EMAIL || 'farmacia.secundaria@example.test', password: passwordFor('DEMO_SECOND_PHARMACY_PASSWORD'), phone: '841110004', role: 'PHARMACY', image: '/demo-assets/user-pharmacy-alto-mae.png' },
  { key: 'mavota', name: 'Gestora Farmácia Costa do Sol', email: 'farmacia.costadosol@example.test', password: passwordFor('DEMO_MAVOTA_PHARMACY_PASSWORD'), phone: '841110006', role: 'PHARMACY', image: '/demo-assets/user-pharmacy-costa-sol.png' },
  { key: 'matola', name: 'Gestor Farmácia Matola Centro', email: 'farmacia.matola@example.test', password: passwordFor('DEMO_MATOLA_PHARMACY_PASSWORD'), phone: '841110007', role: 'PHARMACY', image: '/demo-assets/user-pharmacy-matola.png' },
  { key: 'admin', name: process.env.ADMIN_NAME || 'Administrador de Demonstração', email: process.env.DEMO_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin.demo@example.test', password: passwordFor('DEMO_ADMIN_PASSWORD'), phone: process.env.ADMIN_PHONE || '841110005', role: 'ADMIN', image: '/demo-assets/user-admin.png' },
];

const pharmacyDefinitions = [
  { account: 'approved', name: 'Farmácia Baixa Saúde', companyName: 'Baixa Saúde, Lda.', nuit: '400000001', licenseNumber: 'DEMO-ALV-001', address: 'Avenida 25 de Setembro, junto à Praça dos Trabalhadores', city: 'Maputo', province: 'Maputo Cidade', district: 'KaMpfumo', neighborhood: 'Baixa', latitude: -25.96925, longitude: 32.57314, phone: '821110001', whatsapp: '841110001', openingHours: '08:00 - 20:00', location: 'Próximo da Praça dos Trabalhadores', responsibleName: 'Celina Mabote', responsibleRole: 'Directora Técnica', responsibleContact: '841110011', approved: true, suspended: false },
  { account: 'pending', name: 'Farmácia Esperança Demo', companyName: 'Esperança Demo, Lda.', nuit: '400000002', licenseNumber: 'DEMO-PEND-002', address: 'Avenida de Moçambique, próximo do terminal', city: 'Maputo', province: 'Maputo Cidade', district: 'KaMubukwana', neighborhood: 'Zimpeto', latitude: -25.8251, longitude: 32.5762, phone: '821110002', whatsapp: '841110002', openingHours: '08:00 - 18:00', location: 'Terminal do Zimpeto', responsibleName: 'Lúcia Nhantumbo', responsibleRole: 'Farmacêutica', responsibleContact: '841110012', approved: false, suspended: false },
  { account: 'second', name: 'Farmácia Alto Maé Central', companyName: 'Alto Maé Central Demo, Lda.', nuit: '400000003', licenseNumber: 'DEMO-ALV-003', address: 'Avenida 24 de Julho, próximo do Mercado Janet', city: 'Maputo', province: 'Maputo Cidade', district: 'KaMpfumo', neighborhood: 'Alto Maé', latitude: -25.9576, longitude: 32.5710, phone: '821110003', whatsapp: '841110003', openingHours: '07:30 - 21:00', location: 'Mercado Janet', responsibleName: 'Ernesto Cossa', responsibleRole: 'Director Técnico', responsibleContact: '841110013', approved: true, suspended: false },
  { account: 'mavota', name: 'Farmácia Costa do Sol Demo', companyName: 'Costa do Sol Demo, Lda.', nuit: '400000004', licenseNumber: 'DEMO-ALV-004', address: 'Avenida da Marginal, próximo do Mercado do Peixe', city: 'Maputo', province: 'Maputo Cidade', district: 'KaMavota', neighborhood: 'Costa do Sol', latitude: -25.9145, longitude: 32.6417, phone: '821110004', whatsapp: '841110004', openingHours: '08:00 - 19:30', location: 'Mercado do Peixe', responsibleName: 'Ilda Mondlane', responsibleRole: 'Directora Técnica', responsibleContact: '841110014', approved: true, suspended: false },
  { account: 'matola', name: 'Farmácia Matola Centro Demo', companyName: 'Matola Centro Demo, Lda.', nuit: '400000005', licenseNumber: 'DEMO-ALV-005', address: 'Avenida da União Africana, próximo do Conselho Municipal', city: 'Matola', province: 'Maputo Província', district: 'Matola', neighborhood: 'Matola A', latitude: -25.9622, longitude: 32.4589, phone: '821110005', whatsapp: '841110005', openingHours: '07:30 - 20:00', location: 'Conselho Municipal da Matola', responsibleName: 'Tomás Manjate', responsibleRole: 'Director Técnico', responsibleContact: '841110015', approved: true, suspended: false },
];

const pharmacyImages = {
  approved: '/demo-assets/pharmacy-baixa.png',
  pending: '/demo-assets/pharmacy-pending.png',
  second: '/demo-assets/pharmacy-alto-mae.png',
  mavota: '/demo-assets/pharmacy-costa-sol.png',
  matola: '/demo-assets/pharmacy-matola.png',
};

const medicines = [
  ['Paracetamol', 'Analgésicos', 70, 42, 'AVAILABLE'],
  ['Paracetamol', 'Analgésicos', 75, 18, 'AVAILABLE'],
  ['Ibuprofeno', 'Analgésicos', 125, 7, 'AVAILABLE'],
  ['Amoxicilina', 'Antibióticos', 275, 14, 'AVAILABLE'],
  ['Loratadina', 'Antialérgicos', 95, 25, 'AVAILABLE'],
  ['Vitamina C', 'Vitaminas', 145, 30, 'AVAILABLE'],
  ['Azitromicina', 'Antibióticos', 350, 5, 'AVAILABLE'],
  ['Cetirizina', 'Antialérgicos', 105, 0, 'OUT_OF_STOCK'],
  ['Amoxicilina', 'Antibióticos', 290, 9, 'AVAILABLE'],
  ['Complexo B', 'Vitaminas', 210, 12, 'AVAILABLE'],
  ['Paracetamol', 'Analgésicos', 68, 26, 'AVAILABLE', 'mavota'],
  ['Ibuprofeno', 'Analgésicos', 120, 11, 'AVAILABLE', 'mavota'],
  ['Amoxicilina', 'Antibióticos', 285, 8, 'AVAILABLE', 'matola'],
  ['Loratadina', 'Antialérgicos', 90, 0, 'OUT_OF_STOCK', 'matola'],
];

async function upsertUser(definition) {
  const password = await bcrypt.hash(definition.password, 10);
  const email = definition.email.toLowerCase();
  const [user] = await User.findOrCreate({ where: { email }, defaults: { name: definition.name, email, phone: definition.phone, password, role: definition.role, isActive: true } });
  await user.update({ name: definition.name, phone: definition.phone, password, role: definition.role, image: definition.image, isActive: true });
  return user;
}

async function run() {
  await sequelize.authenticate();
  const users = {};
  for (const account of accounts) users[account.key] = await upsertUser(account);
  const pharmacies = [];
  const pharmacyByAccount = {};
  for (const definition of pharmacyDefinitions) {
    const { account, ...pharmacyData } = definition;
    pharmacyData.image = pharmacyImages[account];
    const userId = users[account].id;
    const [pharmacy] = await Pharmacy.findOrCreate({ where: { userId }, defaults: { ...pharmacyData, userId, documents: [] } });
    await pharmacy.update({ ...pharmacyData, userId, reviewStatus: pharmacyData.approved ? 'APPROVED' : 'PENDING' });
    pharmacies.push(pharmacy);
    pharmacyByAccount[account] = pharmacy;
  }
  const categories = {};
  for (const name of ['Analgésicos', 'Antibióticos', 'Vitaminas', 'Antialérgicos']) {
    [categories[name]] = await Category.findOrCreate({ where: { name }, defaults: { name, description: `Categoria fictícia: ${name}` } });
  }
  for (let index = 0; index < medicines.length; index += 1) {
    const [name, category, price, quantity, stockStatus, pharmacyAccount] = medicines[index];
    const pharmacy = pharmacyAccount ? pharmacyByAccount[pharmacyAccount] : index % 2 === 0 ? pharmacies[0] : pharmacies[2];
    const where = { pharmacyId: pharmacy.id, name };
    const defaults = { ...where, categoryId: categories[category].id, price, quantity, stockStatus, isActive: true };
    const [medicine] = await Medicine.findOrCreate({ where, defaults });
    await medicine.update(defaults);
  }
  const credentialPath = path.resolve(__dirname, '..', 'demo-credentials.local.txt');
  const content = ['CONTAS FICTÍCIAS DE DEMONSTRAÇÃO', `Geradas em: ${new Date().toISOString()}`, '', ...accounts.flatMap((account) => [`${account.role}: ${account.email}`, `Palavra-passe: ${account.password}`, ''])].join('\n');
  fs.writeFileSync(credentialPath, content, { encoding: 'utf8', mode: 0o600 });
  console.log(`Demo data created: ${accounts.length} users, ${pharmacyDefinitions.length} pharmacies and ${medicines.length} medicines.`);
  console.log('Credentials were written to demo-credentials.local.txt (ignored by Git).');
}

run().then(() => sequelize.close()).catch(async (error) => {
  console.error('Demo seed failed:', error.message);
  await sequelize.close();
  process.exit(1);
});
