module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Não autenticado' });
  }

  const userRole = String(req.user.role || '').toUpperCase();
  const allowed = allowedRoles.map((role) => String(role || '').toUpperCase());

  if (!allowed.includes(userRole)) {
    console.warn(`roleMiddleware blocked user ${req.user.id} with role "${req.user.role}". Allowed roles: ${allowedRoles.join(', ')}`);
    return res.status(403).json({ success: false, message: 'Acesso não autorizado' });
  }

  next();
};
