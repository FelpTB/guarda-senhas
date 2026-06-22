require('dotenv').config();
const express = require('express');
const path = require('path');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não definida. Configure a base de dados PostgreSQL.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET não definida. Configure uma chave secreta segura.');
    process.exit(1);
  }

  await initDb();
  app.listen(PORT, () => {
    console.log(`PassVault Pro a correr na porta ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});
