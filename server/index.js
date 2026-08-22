const express = require('express');
const path = require('path');
const { port, nodeEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const gachaRoutes = require('./routes/gachaRoutes');
const shopRoutes = require('./routes/shopRoutes');
const evolutionRoutes = require('./routes/evolutionRoutes');
const missionRoutes = require('./routes/missionRoutes');
const bossRoutes = require('./routes/bossRoutes');
const pvpRoutes = require('./routes/pvpRoutes');
const { seedMissions } = require('./controllers/missionController');
const seed = require('./database/seed');

const app = express();

// Middleware global
app.use(express.json());

// Servir arquivos estáticos do client (sem cache para desenvolvimento)
app.use(express.static(path.join(__dirname, '..', 'client'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  },
}));

// Servir arquivos estáticos dos assets (imagens, GIFs, sons)
app.use('/assets', express.static(path.join(__dirname, '..', 'assets'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  },
}));

// Rota raiz - mostra as rotas disponíveis
app.get('/', (req, res) => {
  res.json({
    service: 'gacha-game-api',
    version: '0.1.0',
    environment: nodeEnv,
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      account: {
        account: 'GET /api/account',
        characters: 'GET /api/account/characters',
        team: 'GET /api/account/team',
        setTeam: 'PUT /api/account/team',
        avatar: 'PUT /api/account/avatar',
      },
      inventory: {
        list: 'GET /api/inventory',
        use: 'POST /api/inventory/use',
      },
      gacha: {
        banners: 'GET /api/banners',
        bannerDetails: 'GET /api/banners/:id',
        pull: 'POST /api/banners/:id/pull',
      },
    },
  });
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gacha-game-api',
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Favicon (evita erro 404 no console)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Rotas de conta
app.use('/api/account', accountRoutes);

// Rotas de inventário
app.use('/api/inventory', inventoryRoutes);

// Rotas de gacha/banners
app.use('/api/banners', gachaRoutes);

// Rotas da loja
app.use('/api/shop', shopRoutes);

// Rotas de evolução
app.use('/api/evolution', evolutionRoutes);

// Rotas de missões + login diário
app.use('/api/missions', missionRoutes);

// Rotas de bosses
app.use('/api/bosses', bossRoutes);

// Rotas de PvP e ranking
app.use('/api/pvp', pvpRoutes);

// Tratamento de erro 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(port, () => {
  // Garante que o seed completo e as missões estejam presentes
  seed();
  seedMissions();
  console.log(`🚀 Servidor gacha-game rodando em http://localhost:${port}`);
  console.log(`🌍 Ambiente: ${nodeEnv}`);
});
