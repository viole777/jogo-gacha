# 🎮 Gacha Game

Jogo de gacha com heróis de vários animes! Colete personagens lendários, lute contra bosses, dispute PvP e suba no ranking global.

## ✨ Funcionalidades

- 🎴 **Gacha** — Pulls simples (1x) e múltiplos (10x) com taxas por raridade
- 🗂️ **Unidades** — Grade com GIFs idle, filtros, detalhes, time, favoritar, evoluir
- 👹 **Bosses** — Batalhas animadas com cena de combate, barras de HP, dano flutuante e confete
- ⚔️ **PvP** — Batalhas assíncronas com ranking Elo e cena de batalha animada
- 🏆 **Ranking** — Top 50 global com medalhas 🥇🥈🥉 e destaque para o seu card
- 📜 **Missões** — Diárias, semanais e história com recompensas
- 📅 **Login Diário** — Streak com recompensas progressivas
- 🏪 **Loja** — Itens com ícones, compra e venda de personagens
- 🔊 **Sons** — Efeitos sonoros de ataque, dano, vitória e derrota (com botão de mudo)

## 🛠️ Como Instalar

### Opção A — 🖥️ Aplicação Desktop (Python - Recomendado)

Agora o jogo roda como aplicação desktop nativa usando Python, sem precisar de Node.js!

```bash
# 1) Instalar dependências do Python
pip install -r python/game/requirements.txt

# 2) Abrir o jogo em uma janela nativa
python python/game/main.py
```

Ou simplesmente **dê dois cliques em `JOGAR.bat`** no Windows.

O jogo abre em uma janela desktop com todas as imagens reais dos personagens e GIFs de combate locais.

### Opção B: Servidor Web (Node.js)

```bash
# 1) Instalar dependências
npm install

# 2) Subir o servidor
npm start
# ou
node server/index.js
```

O servidor roda em **http://localhost:3000** e serve o frontend automaticamente.

## 🔑 Credenciais de Teste

| Email | Senha | Tipo |
|-------|-------|------|
| `admin@gacha.com` | `G@ch@Adm!n2026#Frieren` | Admin |

Você também pode criar uma conta nova na tela de registro.

## 🖼️ Downloader de Assets

Para baixar/atualizar imagens, GIFs e sons:

```bash
node python/image_tools/download_assets.js
```

Para simular sem baixar:

```bash
node python/image_tools/download_assets.js --dry-run
```

## 🧪 Testes da API

Com o servidor rodando, execute:

```bash
node data/test_api.js
```

O script testa: login, conta, inventário, missões, bosses (com GIFs), ranking, personagens (com GIFs), loja, banners, pull gacha, boss fight (com eventos), PvP opponents e missões.

## 📚 Documentação da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta `{username, email, password}` |
| POST | `/api/auth/login` | Login `{email, password}` → retorna `token` |
| GET | `/api/auth/me` | Dados do usuário autenticado |

### Conta
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/account` | Dados completos da conta (gems, gold, bag, streak) |
| GET | `/api/account/characters` | Personagens da bag (com GIFs) |
| GET | `/api/account/team` | Time ativo |
| PUT | `/api/account/team` | Montar time `{slots: [id1, id2, id3]}` |
| PUT | `/api/account/avatar` | Atualizar avatar `{avatar_url}` |
| PUT | `/api/account/characters/:id/favorite` | Favoritar/desfavoritar |
| PUT | `/api/account/characters/:id/lock` | Bloquear/desbloquear |
| DELETE | `/api/account/characters/:id` | Deletar personagem |

### Gacha
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/banners` | Banners ativos |
| GET | `/api/banners/:id` | Detalhes do banner com taxas |
| POST | `/api/banners/:id/pull` | Pull `{quantity: 1 ou 10}` |

### Inventário
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/inventory` | Itens do inventário |
| POST | `/api/inventory/use` | Usar item `{item_id, quantity, user_character_id?}` |

### Loja
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/shop` | Itens da loja e preços de venda |
| POST | `/api/shop/buy` | Comprar `{item_id, quantity}` |
| POST | `/api/shop/sell` | Vender personagem `{user_character_id}` |

### Evolução
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/evolution/character/:id` | Evoluções disponíveis |
| POST | `/api/evolution/evolve` | Evoluir `{user_character_id, evolution_id}` |

### Missões
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/missions` | Missões agrupadas (diárias, semanais, história) |
| POST | `/api/missions/:id/claim` | Reivindicar recompensa |
| GET | `/api/missions/daily-login` | Status do login diário |
| POST | `/api/missions/daily-login/claim` | Reivindicar login diário |

### Bosses
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/bosses` | Lista de bosses (com GIFs) |
| POST | `/api/bosses/:id/fight` | Lutar `{team: [id1, id2, id3]}` → retorna `events` para animação |

### PvP
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/pvp/ranking` | Ranking global top 50 |
| GET | `/api/pvp/opponents` | Oponentes com rating próximo |
| POST | `/api/pvp/battle` | Desafiar `{defender_id}` → retorna `events` para animação |

## 📁 Estrutura do Projeto

```
├── client/          # Frontend (HTML/CSS/JS)
│   └── index.html   # App completo
├── server/          # Backend (Node.js + Express + SQLite)
│   ├── controllers/ # Lógica de negócio
│   ├── database/    # Schema e conexão
│   ├── middleware/  # Autenticação JWT
│   ├── routes/      # Rotas da API
│   └── index.js     # Servidor principal
├── data/            # Banco SQLite + testes
├── assets/          # Imagens, GIFs e sons
├── python/          # Scripts auxiliares (download, simulação, etc.)
├── render.yaml      # Configuração de deploy no Render
└── docs/            # Documentação
```

## 🚀 Deploy

### Render (Free Plan)

Este projeto está configurado para deploy no **Render** com o plano **gratuito**. Basta seguir os passos:

1. **Commit** todos os arquivos (incluindo `render.yaml`) no seu repositório git (GitHub/GitLab)
2. No painel do Render, clique em **New → Web Service**
3. Conecte seu repositório e selecione a branch
4. O Render detecta `render.yaml` automaticamente e usa:
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Health Check:** `/api/health`
5. **Configure as secrets de segurança** (não exponha no repo):
   - Em _Settings → Environment → Add Secret_:
     - `JWT_SECRET` → gere uma string forte: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
     - (Opcional) `ADMIN_PASSWORD` → senha do admin no seed

#### Limitações do plano gratuito do Render

| Recurso | Free Plan |
|---|---|
| RAM | 512 MB |
| CPU | 0.5 vCPU (compartilhada) |
| Disco | 1 GB (ephemeral) |
| Sleep | Após 15 min sem requests |
| DB | Nenhuma gerenciada (SQLite local) |
| HTTPS | Automático em `*.onrender.com` |

> ⚠️ O SQLite usa disco local. Em **redeploy** ou **escala**, o banco é recriado pelo `seed()` automaticamente. Dados de usuários são perdidos em redeploy, mas persistem entre ciclos de sleep/wake. Ideal para demonstração e estudo.

### Deploy Manual (qualquer VPS)

1. Copie `.env.example` para `.env` e ajuste as variáveis
2. `npm install`
3. `npm start`
4. O servidor serve os estáticos do `client/` e `assets/` automaticamente

## 📄 Licença

Projeto educacional — uso livre para aprendizado.
