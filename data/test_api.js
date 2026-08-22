const http = require('http');

function request(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const options = { hostname: 'localhost', port: 3000, path, method, headers };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== TESTE 1: LOGIN ADMIN ===');
  const login = await request('/api/auth/login', 'POST', {
    email: 'admin@gacha.com',
    password: 'G@ch@Adm!n2026#Frieren',
  });
  console.log('Status:', login.status);
  console.log('Resposta:', JSON.stringify(login.data).slice(0, 300));
  const token = login.data && login.data.token;
  if (!token) { console.log('FALHA NO LOGIN - abortando'); return; }
  console.log('Token OK!');

  console.log('\n=== TESTE 2: CONTA ===');
  const account = await request('/api/account', 'GET', null, token);
  console.log('Status:', account.status);
  console.log('Bag:', account.data.user && account.data.user.bag_count, '/', account.data.user && account.data.user.bag_limit);

  console.log('\n=== TESTE 3: INVENTÁRIO ===');
  const inv = await request('/api/inventory', 'GET', null, token);
  console.log('Status:', inv.status);
  if (inv.data.items) console.log('Itens:', inv.data.items.map((i) => `${i.item_name} (${i.item_type}) x${i.quantity}`).join(', '));

  console.log('\n=== TESTE 4: MISSÕES DIÁRIO ===');
  const daily = await request('/api/missions/daily-login', 'GET', null, token);
  console.log('Status:', daily.status, '| Pode reivindicar:', daily.data.can_claim, '| Streak:', daily.data.streak);

  console.log('\n=== TESTE 5: BOSSES (com GIFs) ===');
  const bosses = await request('/api/bosses', 'GET', null, token);
  console.log('Status:', bosses.status, '| Bosses:', bosses.data.bosses && bosses.data.bosses.length);
  if (bosses.data.bosses && bosses.data.bosses.length > 0) {
    const b = bosses.data.bosses[0];
    console.log('Primeiro boss:', b.name, '| image_url:', b.image_url ? 'OK' : 'FALTA');
    console.log('  gif_attack_url:', b.gif_attack_url ? 'OK' : 'FALTA');
    console.log('  gif_defend_url:', b.gif_defend_url ? 'OK' : 'FALTA');
  }

  console.log('\n=== TESTE 6: RANKING ===');
  const ranking = await request('/api/pvp/ranking', 'GET', null, token);
  console.log('Status:', ranking.status, '| Meu rating:', ranking.data.my_rating);

  console.log('\n=== TESTE 7: PERSONAGENS (com GIFs) ===');
  const chars = await request('/api/account/characters', 'GET', null, token);
  console.log('Status:', chars.status, '| Personagens:', chars.data.characters && chars.data.characters.length);
  if (chars.data.characters && chars.data.characters.length > 0) {
    const first = chars.data.characters[0];
    console.log('Primeiro:', first.name, '| ID:', first.id, '| max_hp:', first.max_hp_formatted);
    console.log('  image_idle_url:', first.image_idle_url ? 'OK' : 'FALTA');
    console.log('  gif_attack_url:', first.gif_attack_url ? 'OK' : 'FALTA');
    console.log('  gif_defend_url:', first.gif_defend_url ? 'OK' : 'FALTA');
    const evos = await request('/api/evolution/character/' + first.id, 'GET', null, token);
    console.log('Evoluções:', evos.status, evos.data.evolutions && evos.data.evolutions.length);
  }

  console.log('\n=== TESTE 8: LOJA ===');
  const shop = await request('/api/shop', 'GET', null, token);
  console.log('Status:', shop.status, '| Itens loja:', shop.data.items && shop.data.items.length);

  console.log('\n=== TESTE 9: BANNERS ===');
  const banners = await request('/api/banners', 'GET', null, token);
  console.log('Status:', banners.status, '| Banners:', banners.data.banners && banners.data.banners.length);
  if (banners.data.banners && banners.data.banners.length > 0) {
    const bannerId = banners.data.banners[0].id;
    const det = await request('/api/banners/' + bannerId, 'GET', null, token);
    console.log('Detalhes banner:', det.status, '| Itens:', det.data.items && det.data.items.length);
    if (det.data.items && det.data.items.length > 0) {
      const it = det.data.items[0];
      console.log('  Primeiro item:', it.name, '| image_url:', it.image_url ? 'OK' : 'FALTA');
    }
  }
  console.log('\n=== TESTE ESPECIAL: VIOLE ===');

const account = await request('/api/account', 'GET', null, token);

console.log('Usuário:', account.data.user.username);
console.log('Admin:', account.data.user.is_admin ? 'SIM' : 'NÃO');

const ranking = await request('/api/pvp/ranking', 'GET', null, token);

if (ranking.data.ranking && ranking.data.ranking.length > 0) {
    const top1 = ranking.data.ranking[0];

    console.log('Top 1:', top1.username);

    if (top1.username === 'Viole') {
        console.log('✅ Viole está em primeiro lugar!');
    } else {
        console.log('❌ ERRO: Viole não está em primeiro lugar!');
    }
}

  console.log('\n=== TESTE 10: PULL GACHA (1x) ===');
  if (banners.data.banners && banners.data.banners.length > 0) {
    const bannerId = banners.data.banners[0].id;
    const pull = await request('/api/banners/' + bannerId + '/pull', 'POST', { quantity: 1 }, token);
    console.log('Status:', pull.status);
    if (pull.data.results) {
      const r = pull.data.results[0];
      console.log('  Pull:', r.name, '| rarity:', r.rarity);
      console.log('  image_idle_url:', r.image_idle_url ? 'OK' : 'FALTA');
      console.log('  gif_attack_url:', r.gif_attack_url ? 'OK' : 'FALTA');
    }
  }

  console.log('\n=== TESTE 11: BOSS FIGHT (com eventos) ===');
  const team = await request('/api/account/team', 'GET', null, token);
  if (team.data.team && team.data.team.length > 0) {
    const teamIds = team.data.team.map((c) => c.user_character_id);
    const bossId = bosses.data.bosses[0].id;
    const fight = await request('/api/bosses/' + bossId + '/fight', 'POST', { team: teamIds }, token);
    console.log('Status:', fight.status, '| Vitória:', fight.data.victory);
    console.log('  Eventos:', fight.data.events ? fight.data.events.length : 0);
    console.log('  Log linhas:', fight.data.log ? fight.data.log.length : 0);
    console.log('  Boss GIF attack:', fight.data.boss && fight.data.boss.gif_attack_url ? 'OK' : 'FALTA');
    if (fight.data.events && fight.data.events.length > 0) {
      const ev = fight.data.events[0];
      console.log('  Primeiro evento:', ev.type, '| dano:', ev.damage_formatted);
    }
  } else {
    console.log('  Sem time montado - pule o teste de boss fight');
  }

  console.log('\n=== TESTE 12: PVP OPPONENTS ===');
  const opps = await request('/api/pvp/opponents', 'GET', null, token);
  console.log('Status:', opps.status, '| Oponentes:', opps.data.opponents && opps.data.opponents.length);
  if (opps.data.opponents && opps.data.opponents.length > 0) {
    const o = opps.data.opponents[0];
    console.log('  Primeiro oponente:', o.username, '| team_avatar:', o.team_avatar ? 'OK' : 'FALTA');
  }

  console.log('\n=== TESTE 13: MISSÕES ===');
  const missions = await request('/api/missions', 'GET', null, token);
  console.log('Status:', missions.status);
  if (missions.data.grouped) {
    console.log('  Diárias:', missions.data.grouped.daily ? missions.data.grouped.daily.length : 0);
    console.log('  Semanais:', missions.data.grouped.weekly ? missions.data.grouped.weekly.length : 0);
    console.log('  História:', missions.data.grouped.story ? missions.data.grouped.story.length : 0);
  }

  console.log('\n✅ TESTES CONCLUÍDOS!');
}

main().catch((e) => console.error('ERRO:', e.message));
