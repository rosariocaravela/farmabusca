const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeEmail,
  normalizeSelfRegisterRole,
  sanitizeUser,
} = require('../src/utils/authPolicy');

test('permite apenas os perfis públicos', () => {
  assert.equal(normalizeSelfRegisterRole('patient'), 'PATIENT');
  assert.equal(normalizeSelfRegisterRole('PHARMACY'), 'PHARMACY');
});

test('bloqueia o registo público de administradores', () => {
  assert.throws(
    () => normalizeSelfRegisterRole('ADMIN'),
    (error) => error.statusCode === 400 && error.message === 'Tipo de conta inválido'
  );
});

test('normaliza o email', () => {
  assert.equal(normalizeEmail('  Pessoa@Exemplo.COM  '), 'pessoa@exemplo.com');
});

test('remove campos sensíveis do utilizador', () => {
  const sanitized = sanitizeUser({
    id: '1',
    email: 'pessoa@exemplo.com',
    password: 'hash',
    resetPasswordToken: 'token',
    resetPasswordExpires: new Date(),
  });

  assert.deepEqual(sanitized, {
    id: '1',
    email: 'pessoa@exemplo.com',
  });
});
