# 🎮 Gacha Game — Próximos Passos

> Guia de tarefas pendentes para qualquer desenvolvedor que for continuar o projeto.

---

## ✅ O que JÁ ESTÁ FEITO

### Backend (Node.js + Express + SQLite)
- [x] Servidor base em `server/index.js` com rotas montadas
- [x] Banco de dados SQLite em `data/gacha-game.db` (schema em `server/database/schema.js`)
- [x] Autenticação JWT + bcrypt (`server/controllers/authController.js`)
- [x] Sistema de contas, inventário, personagens, evolução
- [x] Banners e gacha (`server/controllers/gachaController.js`)
- [x] Bosses com sistema de luta (`server/controllers/bossController.js`)
- [x] PvP com ranking (`server/controllers/pvpController.js`)
- [x] Missões diárias/semanais/história + login diário
- [x] Loja de itens (`server/controllers/shopController.js`)

### Assets (imagens, GIFs e sons)
- [x] Download concluído: **10 personagens** (Frieren, Gilgamesh, Madoka, Aizen, Ulquiorra, Kars, DIO, Renji, Yusuke, Gon) com:
  - Imagem estática (`assets/images/`)
  - GIFs: idle, attack, defend, skill, hit, victory, defeat (`assets/gifs/`)
- [x] Download concluído: **9 bosses** (Aizen, Ulquiorra, Kars, DIO, Kamina, Saitama, All For One, Light Yagami, Askeladd) com:
  - Imagem estática (`assets/images/boss_*.png`)
  - GIFs de ataque e defesa (`assets/gifs/boss_*_attack.gif`, `boss_*_defend.gif`)
- [x] Sons placeholder criados (`assets/sounds/`)
- [x] Colunas do banco atualizadas (`image_url`, `gif_*_url`) — via `python/image_tools/download_assets.js`

### Frontend (client/index.html)
- [x] Login, registro, layout brutalista (cartoon)
- [x] Banners, gacha (single/10x), resultados animados
- [x] Unidades com grade, filtros, detalhes, time, favoritar, evoluir
- [x] Itens (poções, alimentos, tickets) com uso em personagem
- [x] Bosses — **lista de bosses já mostra imagem** (miniatura adicionada no `openBosses`)
- [x] Missões, login diário, PvP, ranking, loja

---

## ❌ O QUE AINDA FALTA FAZER

### 1. 🎬 Boss Fight mais VISUAL (prioridade alta)
A tela atual de resultado da luta (`fightBoss`) é um texto simples. Precisa virar uma **cena de batalha animada**:

- [ ] **Tela de "batalha" com os dois lados:**
  - Boss à esquerda com imagem/GIF grande (usar `gif_attack_url`/`gif_defend_url`)
  - Time do jogador à direita (avatars dos personagens selecionados)
- [ ] **Barras de HP animadas** (boss + cada personagem do time)
  - Animar a barra diminuindo conforme o dano
  - Mudar cor (verde → amarelo → vermelho)
- [ ] **Efeitos de "shake" no boss** quando ele ataca / apanha (CSS animation)
- [ ] **Números de dano flutuando** (ex: `-1250`) sobre o alvo
- [ ] **Replay do log de batalha** com timer:
  - Mostrar linha por linha do `d.log` com intervalo (~800ms)
  - Atualizar as barras de HP em tempo real a cada linha
- [ ] **GIF de ataque** do boss ao final (ou enquanto o boss ataca)
- [ ] **Tela de vitória/derrota bonita:**
  - Confete se vitória (CSS/canvas simples)
  - Mostrar drops ganhos com ícone
- [ ] Botão "Pular animação" (ir direto ao resultado)
- [ ] Botão "Lutar novamente"

**Dica:** usar os campos `gif_attack_url`, `gif_defend_url`, `image_url` que já estão no banco via `/api/bosses` e `/api/account/characters`.

---

### 2. 🖼️ Unidades mais VISUAIS (prioridade alta)
A grade de unidades usa só a imagem estática. Melhorar:

- [ ] **Card da unidade com GIF idle** (`image_idle_url` ou `gif_*_url`) em vez de imagem estática
- [ ] **Mini animação ao passar o mouse** (hover: girar o avatar levemente, elevar o card)
- [ ] **GIF de ataque quando seleciona a unidade** no painel de detalhes
- [ ] **Badge animada de raridade** (ex: pulso de brilho para secret/mythic)
- [ ] **Barra de XP visível** no card (não só HP)
- [ ] **Sombra colorida** conforme o elemento (fogo = laranja, água = azul, etc.)

---

### 3. 🏪 Loja mais visual
- [ ] Mostrar ícone/imagem dos itens à venda (em vez de só texto)
- [ ] Toast/confirmação bonita ao comprar
- [ ] Seção "Vender personagem" com preview do valor

---

### 4. ⚔️ PvP visual
- [ ] Tela de batalha PvP igual à da boss fight (animações)
- [ ] Mostrar avatares dos oponentes na lista
- [ ] Histórico de lutas (vitórias/derrotas) com mini-resumo visual

---

### 5. 🏆 Ranking visual
- [ ] Medalhas 🥇🥈🥉 com destaque colorido
- [ ] Mostrar avatar/time do top 3
- [ ] Seu card destacado ("Você")

---

### 6. 🔊 Sons no jogo
- [ ] Sons placeholder já existem (`assets/sounds/`)
- [ ] Integrar via `Audio()` no frontend:
  - [ ] Som ao puxar gacha (especial para secret/mythic)
  - [ ] Som de ataque/dano na boss fight
  - [ ] Som de vitória/derrota
  - [ ] Som de clique nos botões
- [ ] Alternar som ligado/desligado (botão no topbar)

---

### 7. 🧪 Testes e Validação
- [ ] Criar script de teste da API (`data/test_api.js` já existe, revisar/expandir)
- [ ] Testar fluxo completo: login → pull → boss fight → usar item → evoluir → PvP
- [ ] Verificar se as colunas `image_url`/`gif_*_url` são retornadas nas rotas:
  - `GET /api/bosses` (retorna `image_url`? testar)
  - `GET /api/account/characters` (retorna `gif_idle_url`? testar)
- [ ] Corrigir **login padrão** se necessário (o HTML tem `admin@gacha.com` como pré-existente)

---

### 8. 📄 Documentação
- [ ] `README.md` com:
  - Como instalar (`npm install`)
  - Como rodar (`npm start` ou `node server/index.js`)
  - Como rodar o downloader de assets (`node python/image_tools/download_assets.js`)
  - Credenciais de teste
- [ ] Documentar a API (endpoints principais)

---

### 9. 🚀 Publicação/Deploy (opcional)
- [ ] Servir `client/index.html` via Express (static) para abrir em `http://localhost:3000`
- [ ] Preparar `.env` de produção (existe `.env.example`)
- [ ] Build/minificação do frontend

---

## 🛠️ Como rodar o projeto agora

```bash
# 1) Subir o servidor
node server/index.js

# 2) Abrir o cliente em outro terminal/aba
#    (se não houver rota estática, abrir client/index.html direto)
```

---

## 📌 Ordem recomendada de execução

1. **Boss Fight visual** (item 1) — é o que o usuário mais pediu
2. **Unidades visuais** (item 2) — aproveita os GIFs já baixados
3. **Sons** (item 6) — fácil e dá vida ao jogo
4. **PvP e Ranking** (itens 3, 4, 5) — visuais nos modos restantes
5. **Testes** (item 7)
6. **Documentação e deploy** (itens 8, 9)

---

*Última atualização: aguardando implementação das tarefas acima.*