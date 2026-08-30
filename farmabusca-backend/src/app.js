require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const adminRoutes = require('./routes/adminRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

const configuredOrigins = String(process.env.CORS_ORIGINS || 'http://localhost:19006,http://localhost:8081,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
    const error = new Error('Origem não autorizada pelo CORS');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/demo-assets', express.static(path.resolve(__dirname, '..', 'public', 'demo-assets'), { maxAge: '1d', immutable: false }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FarmaBusca API',
    version: '1.0.0',
    description: 'Backend REST do FarmaBusca para pacientes, farmácias e administradores.',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/auth/register': { post: { summary: 'Criar conta' } },
    '/auth/login': { post: { summary: 'Login' } },
    '/auth/profile': { get: { summary: 'Perfil autenticado' } },
    '/medicines': { get: { summary: 'Listar medicamentos' } },
    '/medicines/search': { get: { summary: 'Pesquisar medicamentos' } },
    '/pharmacies': { get: { summary: 'Listar farmácias' } },
    '/favorites': { get: { summary: 'Listar favoritos' }, post: { summary: 'Adicionar favorito' } },
    '/payments': { post: { summary: 'Iniciar pagamento da reserva de 25 MT' } },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'FarmaBusca API is running', data: {} });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorMiddleware);

module.exports = app;
