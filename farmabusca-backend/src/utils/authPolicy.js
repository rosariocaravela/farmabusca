const SELF_REGISTER_ROLES = new Set(['PATIENT', 'PHARMACY']);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeSelfRegisterRole = (role = 'PATIENT') => {
  const normalizedRole = String(role || 'PATIENT').toUpperCase();
  if (!SELF_REGISTER_ROLES.has(normalizedRole)) {
    const error = new Error('Tipo de conta inválido');
    error.statusCode = 400;
    throw error;
  }
  return normalizedRole;
};

const sanitizeUser = (user) => {
  const data = user?.toJSON ? user.toJSON() : { ...(user || {}) };
  delete data.password;
  delete data.resetPasswordToken;
  delete data.resetPasswordExpires;
  return data;
};

module.exports = {
  normalizeEmail,
  normalizeSelfRegisterRole,
  sanitizeUser,
};
