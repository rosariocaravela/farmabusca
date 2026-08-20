require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { connectDb } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const adminRoutes = require('./routes/adminRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDb();

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
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'FarmaBusca API is running', data: {} });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorMiddleware);

module.exports = app;
