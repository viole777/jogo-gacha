#!/usr/bin/env node
/**
 * 🌍 Baixa Imagens Reais dos Personagens (AniList) + Gera GIFs Locais
 *
 * Baixa imagens reais de personagens de anime da API pública do AniList,
 * gera GIFs de combate animados localmente (via Pillow/Python), e
 * atualiza o banco SQLite com as URLs locais.
 *
 * Uso:
 *   node python/image_tools/download_assets.js
 *   node python/image_tools/download_assets.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const BASE_DIR = path.resolve(__dirname, '..', '..');
const DB_PATH = path.join(BASE_DIR, 'data', 'gacha-game.db');
const IMAGES_DIR = path.join(BASE_DIR, 'assets', 'images');
const GIFS_DIR = path.join(BASE_DIR, 'assets', 'gifs');
const SOUNDS_DIR = path.join(BASE_DIR, 'assets', 'sounds');
const TF_DB = path.join(BASE_DIR, 'data', 'gacha-game.db');

const ANILIST_API = 'https://graphql.anilist.co';
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

// ====== Mapeamento de personajes → IDs del AniList ======
// ID del banco local → { file, anilist_id }
const CHARACTERS = [
  { db_id: 1, file: 'frieren', anilist_id: 176754 },
  { db_id: 2, file: 'gilgamesh', anilist_id: 2514 },
  { db_id: 3, file: 'madoka', anilist_id: 37832 },
  { db_id: 4, file: 'ichigo', anilist_id: 5 },
  { db_id: 5, file: 'johan', anilist_id: 719 },
  { db_id: 6, file: 'jotaro', anilist_id: 4003 },
  { db_id: 7, file: 'dio', anilist_id: 4004 },
  { db_id: 8, file: 'giorno', anilist_id: 10529 },
  { db_id: 9, file: 'rukia', anilist_id: 6 },
  { db_id: 10, file: 'aizen', anilist_id: 1086 },
  { db_id: 11, file: 'fern', anilist_id: 183965 },
  { db_id: 12, file: 'stark', anilist_id: 184313 },
  { db_id: 13, file: 'joseph', anilist_id: 6356 },
  { db_id: 14, file: 'kars', anilist_id: 21966 },
  { db_id: 15, file: 'uryu', anilist_id: 564 },
  { db_id: 16, file: 'orihime', anilist_id: 7 },
  { db_id: 17, file: 'eisen', anilist_id: 184312 },
  { db_id: 18, file: 'caesar', anilist_id: 21959 },
  { db_id: 19, file: 'lisa', anilist_id: 21960 },
  { db_id: 20, file: 'renji', anilist_id: 906 },
  { db_id: 21, file: 'sein', anilist_id: 205177 },
  { db_id: 22, file: 'speedwagon', anilist_id: 21938 },
  { db_id: 23, file: 'karin', anilist_id: 4018 },
  { db_id: 24, file: 'kraft', anilist_id: 219732 },
  { db_id: 25, file: 'erina', anilist_id: 21937 },
  { db_id: 26, file: 'yuzu', anilist_id: 1096 },
  { db_id: 27, file: 'heiter', anilist_id: 184310 },
  { db_id: 28, file: 'poco', anilist_id: 89479 },
];

// ====== Mapeamiento de bosses → IDs del AniList ======
const BOSSES = [
  { db_id: 1, file: 'boss_aizen', anilist_id: 1086 },
  { db_id: 2, file: 'boss_ulquiorra', anilist_id: 1081 },
  { db_id: 3, file: 'boss_grimmjow', anilist_id: 1080 },
  { db_id: 4, file: 'boss_frieren_dragon', anilist_id: 184313 }, // Dragão Ancião - usa Stark como referencia visual
  { db_id: 5, file: 'boss_qual', anilist_id: 315278 },
  { db_id: 6, file: 'boss_wolf', anilist_id: 176754 }, // Lobo Demoníaco - usa Frieren
  { db_id: 7, file: 'boss_kars', anilist_id: 21966 },
  { db_id: 8, file: 'boss_dio', anilist_id: 4004 },
  { db_id: 9, file: 'boss_acdc', anilist_id: 21964 },
];

const RARITY_COLORS = {
  common: '95A5A6', rare: '74B9FF', epic: '4F9DDE',
  legendary: 'B388FF', mythic: 'FFC93C', secret: 'FF3B3B',
};

const STATES = ['idle', 'attack', 'defend', 'skill', 'hit', 'victory', 'defeat'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function download(url, filepath) {
  return new Promise((resolve) => {
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
      console.log('  📥 (skip) ' + path.relative(BASE_DIR, filepath));
      return resolve(filepath);
    }
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'GachaGame-AssetDownloader/1.0' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        if (data.length > 1000) {
          ensureDir(path.dirname(filepath));
          fs.writeFileSync(filepath, data);
          console.log('  📥 ' + path.relative(BASE_DIR, filepath) + ' (' + data.length + ' bytes)');
          resolve(filepath);
        } else {
          console.log('  ❌ Falhou: ' + url);
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(15000, () => { req.destroy(); resolve(null); });
  });
}

async function anilistGetById(id) {
  const query = `
    query {
      Character(id: ${id}) {
        id
        name { full }
        image { large }
      }
    }
  `;
  try {
    const r = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const d = await r.json();
    if (d.data && d.data.Character) {
      return d.data.Character;
    }
  } catch (e) {}
  return null;
}

async function anilistSearch(name) {
  const query = `
    query ($search: String) {
      Character(search: $search) {
        id
        name { full }
        image { large }
      }
    }
  `;
  try {
    const r = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: name } })
    });
    const d = await r.json();
    if (d.data && d.data.Character) return d.data.Character;
  } catch (e) {}
  return null;
}

async function wikipediaImage(name) {
  const params = new URLSearchParams({
    action: 'query',
    titles: name.replace(/ /g, '_'),
    prop: 'pageimages',
    format: 'json',
    pithumbsize: '440',
    redirects: '1',
  });
  try {
    const response = await fetch(`${WIKIPEDIA_API}?${params}`, {
      headers: { 'User-Agent': 'GachaGameAssetDownloader/1.0 (local development)' },
    });
    const data = await response.json();
    const page = Object.values(data.query?.pages || {})[0];
    return page?.thumbnail?.source || null;
  } catch (e) {
    return null;
  }
}

async function commonsImage(name) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${name} character -cosplay -costume -fanart`,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '440',
    format: 'json',
  });
  try {
    const response = await fetch(`${COMMONS_API}?${params}`, {
      headers: { 'User-Agent': 'GachaGameAssetDownloader/1.0 (local development)' },
    });
    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});
    const page = pages.find((candidate) => !/cosplay|costume|fanart/i.test(candidate.title));
    return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || null;
  } catch (e) {
    return null;
  }
}

async function generateGifForState(inputFile, outputFile, state) {
  return new Promise((resolve) => {
    try {
      const script = path.join(BASE_DIR, 'python', 'image_tools', 'combat_gif_generator.py');
      execSync(`python "${script}" "${inputFile}" "${outputFile}" ${state}`, { stdio: 'pipe' });
      resolve(outputFile);
    } catch (e) {
      console.log('  ❌ GIF falhou: ' + state + ' → ' + e.message);
      resolve(null);
    }
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run');
  console.log('=' .repeat(60));
  console.log('  🌍 DOWNLOADER DE ASSETS REAIS (AniList + Pillow GIFs)');
  console.log('=' .repeat(60));

  // Conecta ao DB
  let db;
  try {
    db = require('better-sqlite3')(DB_PATH);
    // Garante colunas
    for (const table of ['characters', 'bosses']) {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(r => r.name);
      const needed = table === 'characters'
        ? ['image_url', 'image_idle_url', 'gif_attack_url', 'gif_defend_url', 'gif_skill_url', 'gif_hit_url', 'gif_victory_url', 'gif_defeat_url']
        : ['image_url', 'gif_attack_url', 'gif_defend_url', 'gif_skill_url'];
      for (const c of needed) {
        if (!cols.includes(c)) {
          db.prepare(`ALTER TABLE ${table} ADD COLUMN ${c} TEXT`).run();
          console.log(`  ➕ Coluna ${c} em ${table}`);
        }
      }
    }
  } catch (e) {
    console.log('⚠️  Não conectou ao DB:', e.message);
  }

  const AP = '/assets/';

  // ====== Personagens ======
  console.log('\n' + '─'.repeat(60));
  console.log('  🧙 PERSONAGENS');
  console.log('─'.repeat(60));

  for (const c of CHARACTERS) {
    console.log('\n🔧 ' + c.file + ' (db_id=' + (c.db_id || 'by name') + ')');

    if (!dry) {
      // Busca URL real do AniList
      const anilistCharacter = c.anilist_id
        ? await anilistGetById(c.anilist_id)
        : await anilistSearch(c.search);
      const imageUrl = anilistCharacter?.image?.large
        || await wikipediaImage(c.search || c.file)
        || await commonsImage(c.search || c.file);
      if (!imageUrl) {
        console.log('  ❌ Imagem não encontrada em AniList, Wikipédia ou Commons: ' + c.file);
        continue;
      }
      console.log('  🎯 Fonte da imagem: ' + (anilistCharacter ? 'AniList' : 'Wikipédia/Commons'));
      
      // Baixa imagem estática
      const imgPath = path.join(IMAGES_DIR, c.file + '.png');
      await download(imageUrl, imgPath);
      if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 1000) {
        console.log('  ⚠️ Falha ao baixar imagem, usando placeholder');
        continue;
      }

      // Gera GIFs locais
      for (const state of STATES) {
        const gifPath = path.join(GIFS_DIR, c.file + '_' + state + '.gif');
        if (!fs.existsSync(gifPath) || fs.statSync(gifPath).size < 1000) {
          await generateGifForState(imgPath, gifPath, state);
        } else {
          console.log('  📥 (skip) ' + path.relative(BASE_DIR, gifPath));
        }
      }

      // Atualiza banco
      if (db) {
        const dbCharacter = c.db_id
          ? { id: c.db_id }
          : db.prepare('SELECT id FROM characters WHERE name = ?').get(c.name);
        if (!dbCharacter) {
          console.log('  ❌ Personagem não encontrado no banco: ' + c.name);
          continue;
        }
        const updates = {
          image_url: AP + 'images/' + c.file + '.png',
          image_idle_url: AP + 'images/' + c.file + '.png',
          gif_attack_url: AP + 'gifs/' + c.file + '_attack.gif',
          gif_defend_url: AP + 'gifs/' + c.file + '_defend.gif',
          gif_skill_url: AP + 'gifs/' + c.file + '_skill.gif',
          gif_hit_url: AP + 'gifs/' + c.file + '_hit.gif',
          gif_victory_url: AP + 'gifs/' + c.file + '_victory.gif',
          gif_defeat_url: AP + 'gifs/' + c.file + '_defeat.gif',
        };
        const set = Object.keys(updates).map(k => k + ' = ?').join(', ');
        db.prepare('UPDATE characters SET ' + set + ' WHERE id = ?').run(...Object.values(updates), dbCharacter.id);
        console.log('  📝 Banco atualizado: ' + c.file);
      }
    } else {
      console.log('  [DRY-RUN] Baixaria imagem + GIFs para: ' + c.file);
    }

    // Rate limit AniList
    await new Promise(r => setTimeout(r, 700));
  }

  // ====== Bosses ======
  console.log('\n' + '─'.repeat(60));
  console.log('  👹 BOSSES');
  console.log('─'.repeat(60));

  for (const b of BOSSES) {
    console.log('\n👹 ' + b.file + ' (db_id=' + b.db_id + ')');

    if (!dry) {
      const boss = await anilistGetById(b.anilist_id);
      if (!boss) {
        console.log('  ❌ Boss não encontrado no AniList: ' + b.file);
        continue;
      }
      console.log('  🎯 ' + boss.name.full);

      const imgPath = path.join(IMAGES_DIR, b.file + '.png');
      await download(boss.image.large, imgPath);
      if (!fs.existsSync(imgPath) || fs.statSync(imgPath).size < 1000) {
        console.log('  ⚠️ Falha ao baixar imagem do boss');
        continue;
      }

      // GIFs de boss (attack, defend, skill)
      for (const state of ['attack', 'defend', 'skill']) {
        const gifPath = path.join(GIFS_DIR, b.file + '_' + state + '.gif');
        if (!fs.existsSync(gifPath) || fs.statSync(gifPath).size < 1000) {
          await generateGifForState(imgPath, gifPath, state);
        } else {
          console.log('  📥 (skip) ' + path.relative(BASE_DIR, gifPath));
        }
      }

      // Atualiza banco
      if (db) {
        db.prepare('UPDATE bosses SET image_url = ?, gif_attack_url = ?, gif_defend_url = ?, gif_skill_url = ? WHERE id = ?').run(
          AP + 'images/' + b.file + '.png',
          AP + 'gifs/' + b.file + '_attack.gif',
          AP + 'gifs/' + b.file + '_defend.gif',
          AP + 'gifs/' + b.file + '_skill.gif',
          b.db_id
        );
        console.log('  📝 Banco atualizado: ' + b.file);
      }
    } else {
      console.log('  [DRY-RUN] Baixaria imagem + GIFs para: ' + b.file);
    }

    await new Promise(r => setTimeout(r, 700));
  }

  // ====== Sons ======
  if (!dry) {
    ensureDir(SOUNDS_DIR);
    for (const s of ['attack', 'defend', 'skill', 'hit', 'victory', 'defeat']) {
      const p = path.join(SOUNDS_DIR, s + '.wav');
      if (!fs.existsSync(p)) {
        const h = Buffer.alloc(44);
        h.write('RIFF', 0); h.write('WAVE', 8); h.write('fmt ', 12);
        h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
        h.writeUInt32LE(22050, 24); h.writeUInt32LE(22050, 28); h.writeUInt16LE(1, 32);
        h.writeUInt16LE(8, 34); h.write('data', 36); h.writeUInt32LE(0, 40);
        fs.writeFileSync(p, h);
        console.log('  🔊 Som placeholder: ' + path.relative(BASE_DIR, p));
      }
    }
  }

  if (db) db.close();
  console.log('\n' + '='.repeat(60));
  console.log('  ✅ DOWNLOAD CONCLUÍDO!');
  console.log('  Imagens: ' + IMAGES_DIR);
  console.log('  GIFs:    ' + GIFS_DIR);
  console.log('  Sons:    ' + SOUNDS_DIR);
  console.log('='.repeat(60));
}

main().catch((e) => { console.error(e); process.exit(1); });