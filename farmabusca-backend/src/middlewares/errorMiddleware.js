module.exports = (err, req, res, next) => {
  console.error(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'O ficheiro não pode ultrapassar 5 MB',
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Já existe um registo com estes dados',
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: err.errors?.[0]?.message || 'Dados inválidos',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message || 'Erro interno do servidor';

  res.status(statusCode).json({ success: false, message });
};
