const fs = require('fs');
const path = require('path');

const ASSET_ROOT = path.join(__dirname, '..', '..', 'assets');

function normalizeAssetKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ASSET_ROOT, relativePath));
}

function chooseCharacterAssets(charName) {
  const normalized = normalizeAssetKey(charName);
  const map = {
    'frieren': { image: 'frieren.png', gifs: { attack: 'frieren_attack.gif', defend: 'frieren_defend.gif', skill: 'frieren_skill.gif', hit: 'frieren_hit.gif', victory: 'frieren_victory.gif', defeat: 'frieren_defeat.gif' } },
    'gilgamesh': { image: 'gilgamesh.png', gifs: { attack: 'gilgamesh_attack.gif', defend: 'gilgamesh_defend.gif', skill: 'gilgamesh_skill.gif', hit: 'gilgamesh_hit.gif', victory: 'gilgamesh_victory.gif', defeat: 'gilgamesh_defeat.gif' } },
    'madoka kaname': { image: 'madoka.png', gifs: { attack: 'madoka_attack.gif', defend: 'madoka_defend.gif', skill: 'madoka_skill.gif', hit: 'madoka_hit.gif', victory: 'madoka_victory.gif', defeat: 'madoka_defeat.gif' } },
    'ichigo kurosaki': { image: 'ichigo.png', gifs: { attack: 'ichigo_attack.gif', defend: 'ichigo_defend.gif', skill: 'ichigo_skill.gif', hit: 'ichigo_hit.gif', victory: 'ichigo_victory.gif', defeat: 'ichigo_defeat.gif' } },
    'johan liebert': { image: 'johan.png', gifs: { attack: 'johan_attack.gif', defend: 'johan_defend.gif', skill: 'johan_skill.gif', hit: 'johan_hit.gif', victory: 'johan_victory.gif', defeat: 'johan_defeat.gif' } },
    'jotaro kujo': { image: 'jotaro.png', gifs: { attack: 'jotaro_attack.gif', defend: 'jotaro_defend.gif', skill: 'jotaro_skill.gif', hit: 'jotaro_hit.gif', victory: 'jotaro_victory.gif', defeat: 'jotaro_defeat.gif' } },
    'dio brando': { image: 'dio.png', gifs: { attack: 'dio_attack.gif', defend: 'dio_defend.gif', skill: 'dio_skill.gif', hit: 'dio_hit.gif', victory: 'dio_victory.gif', defeat: 'dio_defeat.gif' } },
    'giorno giovanna': { image: 'giorno.png', gifs: { attack: 'giorno_attack.gif', defend: 'giorno_defend.gif', skill: 'giorno_skill.gif', hit: 'giorno_hit.gif', victory: 'giorno_victory.gif', defeat: 'giorno_defeat.gif' } },
    'rukia kuchiki': { image: 'rukia.png', gifs: { attack: 'rukia_attack.gif', defend: 'rukia_defend.gif', skill: 'rukia_skill.gif', hit: 'rukia_hit.gif', victory: 'rukia_victory.gif', defeat: 'rukia_defeat.gif' } },
    'aizen sosuke': { image: 'aizen.png', gifs: { attack: 'aizen_attack.gif', defend: 'aizen_defend.gif', skill: 'aizen_skill.gif', hit: 'aizen_hit.gif', victory: 'aizen_victory.gif', defeat: 'aizen_defeat.gif' } },
    'fern': { image: 'fern.png', gifs: { attack: 'fern_attack.gif', defend: 'fern_defend.gif', skill: 'fern_skill.gif', hit: 'fern_hit.gif', victory: 'fern_victory.gif', defeat: 'fern_defeat.gif' } },
    'stark': { image: 'stark.png', gifs: { attack: 'stark_attack.gif', defend: 'stark_defend.gif', skill: 'stark_skill.gif', hit: 'stark_hit.gif', victory: 'stark_victory.gif', defeat: 'stark_defeat.gif' } },
    'joseph joestar': { image: 'joseph.png', gifs: { attack: 'joseph_attack.gif', defend: 'joseph_defend.gif', skill: 'joseph_skill.gif', hit: 'joseph_hit.gif', victory: 'joseph_victory.gif', defeat: 'joseph_defeat.gif' } },
    'kars': { image: 'kars.png', gifs: { attack: 'kars_attack.gif', defend: 'kars_defend.gif', skill: 'kars_skill.gif', hit: 'kars_hit.gif', victory: 'kars_victory.gif', defeat: 'kars_defeat.gif' } },
    'uryu ishida': { image: 'uryu.png', gifs: { attack: 'uryu_attack.gif', defend: 'uryu_defend.gif', skill: 'uryu_skill.gif', hit: 'uryu_hit.gif', victory: 'uryu_victory.gif', defeat: 'uryu_defeat.gif' } },
    'orihime inoue': { image: 'orihime.png', gifs: { attack: 'orihime_attack.gif', defend: 'orihime_defend.gif', skill: 'orihime_skill.gif', hit: 'orihime_hit.gif', victory: 'orihime_victory.gif', defeat: 'orihime_defeat.gif' } },
    'eisen': { image: 'eisen.png', gifs: { attack: 'eisen_attack.gif', defend: 'eisen_defend.gif', skill: 'eisen_skill.gif', hit: 'eisen_hit.gif', victory: 'eisen_victory.gif', defeat: 'eisen_defeat.gif' } },
    'caesar zeppeli': { image: 'caesar.png', gifs: { attack: 'caesar_attack.gif', defend: 'caesar_defend.gif', skill: 'caesar_skill.gif', hit: 'caesar_hit.gif', victory: 'caesar_victory.gif', defeat: 'caesar_defeat.gif' } },
    'lisa lisa': { image: 'lisa.png', gifs: { attack: 'lisa_attack.gif', defend: 'lisa_defend.gif', skill: 'lisa_skill.gif', hit: 'lisa_hit.gif', victory: 'lisa_victory.gif', defeat: 'lisa_defeat.gif' } },
    'renji abarai': { image: 'renji.png', gifs: { attack: 'renji_attack.gif', defend: 'renji_defend.gif', skill: 'renji_skill.gif', hit: 'renji_hit.gif', victory: 'renji_victory.gif', defeat: 'renji_defeat.gif' } },
    'sein': { image: 'sein.png', gifs: { attack: 'sein_attack.gif', defend: 'sein_defend.gif', skill: 'sein_skill.gif', hit: 'sein_hit.gif', victory: 'sein_victory.gif', defeat: 'sein_defeat.gif' } },
    'speedwagon': { image: 'speedwagon.png', gifs: { attack: 'speedwagon_attack.gif', defend: 'speedwagon_defend.gif', skill: 'speedwagon_skill.gif', hit: 'speedwagon_hit.gif', victory: 'speedwagon_victory.gif', defeat: 'speedwagon_defeat.gif' } },
    'karin kurosaki': { image: 'karin.png', gifs: { attack: 'karin_attack.gif', defend: 'karin_defend.gif', skill: 'karin_skill.gif', hit: 'karin_hit.gif', victory: 'karin_victory.gif', defeat: 'karin_defeat.gif' } },
    'kraft': { image: 'kraft.png', gifs: { attack: 'kraft_attack.gif', defend: 'kraft_defend.gif', skill: 'kraft_skill.gif', hit: 'kraft_hit.gif', victory: 'kraft_victory.gif', defeat: 'kraft_defeat.gif' } },
    'erina joestar': { image: 'erina.png', gifs: { attack: 'erina_attack.gif', defend: 'erina_defend.gif', skill: 'erina_skill.gif', hit: 'erina_hit.gif', victory: 'erina_victory.gif', defeat: 'erina_defeat.gif' } },
    'yuzu kurosaki': { image: 'yuzu.png', gifs: { attack: 'yuzu_attack.gif', defend: 'yuzu_defend.gif', skill: 'yuzu_skill.gif', hit: 'yuzu_hit.gif', victory: 'yuzu_victory.gif', defeat: 'yuzu_defeat.gif' } },
    'heiter': { image: 'heiter.png', gifs: { attack: 'heiter_attack.gif', defend: 'heiter_defend.gif', skill: 'heiter_skill.gif', hit: 'heiter_hit.gif', victory: 'heiter_victory.gif', defeat: 'heiter_defeat.gif' } },
    'poco': { image: 'poco.png', gifs: { attack: 'poco_attack.gif', defend: 'poco_defend.gif', skill: 'poco_skill.gif', hit: 'poco_hit.gif', victory: 'poco_victory.gif', defeat: 'poco_defeat.gif' } },
  };

  const selected = map[normalized];
  if (!selected || !fileExists('images/' + selected.image)) {
    const guessed = normalized.replace(/\s+/g, '');
    const file = guessed + '.png';
    if (fileExists('images/' + file)) {
      return { image: file, gifs: { attack: guessed + '_attack.gif', defend: guessed + '_defend.gif', skill: guessed + '_skill.gif', hit: guessed + '_hit.gif', victory: guessed + '_victory.gif', defeat: guessed + '_defeat.gif' } };
    }
    return null;
  }

  return selected;
}

function chooseBossAssets(bossName) {
  const normalized = normalizeAssetKey(bossName);
  const map = {
    'aizen sosuke hogyoku': { image: 'boss_aizen.png', gifs: { attack: 'boss_aizen_attack.gif', defend: 'boss_aizen_defend.gif', skill: 'boss_aizen_skill.gif' } },
    'ulquiorra cifer': { image: 'boss_ulquiorra.png', gifs: { attack: 'boss_ulquiorra_attack.gif', defend: 'boss_ulquiorra_defend.gif', skill: 'boss_ulquiorra_skill.gif' } },
    'grimmjow jaegerjaquez': { image: 'boss_grimmjow.png', gifs: { attack: 'boss_grimmjow_attack.gif', defend: 'boss_grimmjow_defend.gif', skill: 'boss_grimmjow_skill.gif' } },
    'dragao anciao': { image: 'boss_frieren_dragon.png', gifs: { attack: 'boss_frieren_dragon_attack.gif', defend: 'boss_frieren_dragon_defend.gif', skill: 'boss_frieren_dragon_skill.gif' } },
    'demonio qual': { image: 'boss_qual.png', gifs: { attack: 'boss_qual_attack.gif', defend: 'boss_qual_defend.gif', skill: 'boss_qual_skill.gif' } },
    'lobo demoniaco': { image: 'boss_wolf.png', gifs: { attack: 'boss_wolf_attack.gif', defend: 'boss_wolf_defend.gif', skill: 'boss_wolf_skill.gif' } },
    'kars modo supremo': { image: 'boss_kars.png', gifs: { attack: 'boss_kars_attack.gif', defend: 'boss_kars_defend.gif', skill: 'boss_kars_skill.gif' } },
    'dio the world': { image: 'boss_dio.png', gifs: { attack: 'boss_dio_attack.gif', defend: 'boss_dio_defend.gif', skill: 'boss_dio_skill.gif' } },
    'esidisi': { image: 'boss_acdc.png', gifs: { attack: 'boss_acdc_attack.gif', defend: 'boss_acdc_defend.gif', skill: 'boss_acdc_skill.gif' } },
  };

  const selected = map[normalized];
  if (selected && fileExists('images/' + selected.image)) {
    return selected;
  }

  const baseCandidates = [
    normalized.replace(/\s+/g, '_'),
    normalized.replace(/\s+/g, ''),
    normalized.replace(/\s+/g, '_').replace(/_/g, ''),
    'boss_' + normalized.replace(/\s+/g, '_'),
  ];

  for (const candidate of baseCandidates) {
    const image = candidate + '.png';
    if (fileExists('images/' + image)) {
      const base = candidate.replace(/^boss_/, '');
      return {
        image,
        gifs: {
          attack: (candidate + '_attack.gif').replace(/^boss_/, 'boss_'),
          defend: (candidate + '_defend.gif').replace(/^boss_/, 'boss_'),
          skill: (candidate + '_skill.gif').replace(/^boss_/, 'boss_'),
        },
      };
    }
  }

  return null;
}

function getCharacterAssetUrls(characterName) {
  const selected = chooseCharacterAssets(characterName);
  if (!selected) {
    return {
      image_url: null,
      image_idle_url: null,
      gif_attack_url: null,
      gif_defend_url: null,
      gif_skill_url: null,
      gif_hit_url: null,
      gif_victory_url: null,
      gif_defeat_url: null,
    };
  }

  return {
    image_url: '/assets/images/' + selected.image,
    image_idle_url: '/assets/images/' + selected.image,
    gif_attack_url: '/assets/gifs/' + selected.gifs.attack,
    gif_defend_url: '/assets/gifs/' + selected.gifs.defend,
    gif_skill_url: '/assets/gifs/' + selected.gifs.skill,
    gif_hit_url: '/assets/gifs/' + selected.gifs.hit,
    gif_victory_url: '/assets/gifs/' + selected.gifs.victory,
    gif_defeat_url: '/assets/gifs/' + selected.gifs.defeat,
  };
}

function getBossAssetUrls(bossName) {
  const selected = chooseBossAssets(bossName);
  if (!selected) {
    return {
      image_url: null,
      gif_attack_url: null,
      gif_defend_url: null,
      gif_skill_url: null,
    };
  }

  return {
    image_url: '/assets/images/' + selected.image,
    gif_attack_url: '/assets/gifs/' + selected.gifs.attack,
    gif_defend_url: '/assets/gifs/' + selected.gifs.defend,
    gif_skill_url: '/assets/gifs/' + selected.gifs.skill,
  };
}

function auditAssetUrls(db) {
  const issues = [];

  const characters = db.prepare('SELECT id, name, image_url, image_idle_url, gif_attack_url, gif_defend_url, gif_skill_url, gif_hit_url, gif_victory_url, gif_defeat_url FROM characters ORDER BY id').all();
  for (const character of characters) {
    const urls = getCharacterAssetUrls(character.name);
    const fields = ['image_url', 'image_idle_url', 'gif_attack_url', 'gif_defend_url', 'gif_skill_url', 'gif_hit_url', 'gif_victory_url', 'gif_defeat_url'];
    for (const field of fields) {
      const value = character[field];
      if (!value) {
        issues.push({ type: 'missing', table: 'characters', name: character.name, field });
        continue;
      }
      if (value.includes('\\') || value.includes('C:') || value.includes('D:') || value.includes('/workspaces/') || value.startsWith('.')) {
        issues.push({ type: 'local_path', table: 'characters', name: character.name, field, value });
      }
      if (!value.startsWith('/assets/')) {
        issues.push({ type: 'invalid_url', table: 'characters', name: character.name, field, value });
      }
      const filePath = value.replace(/^\/assets\//, '');
      if (!fs.existsSync(path.join(ASSET_ROOT, filePath))) {
        issues.push({ type: 'missing_file', table: 'characters', name: character.name, field, value });
      }
    }
  }

  const bosses = db.prepare('SELECT id, name, image_url, gif_attack_url, gif_defend_url, gif_skill_url FROM bosses ORDER BY id').all();
  for (const boss of bosses) {
    const urls = getBossAssetUrls(boss.name);
    const fields = ['image_url', 'gif_attack_url', 'gif_defend_url', 'gif_skill_url'];
    for (const field of fields) {
      const value = boss[field];
      if (!value) {
        issues.push({ type: 'missing', table: 'bosses', name: boss.name, field });
        continue;
      }
      if (value.includes('\\') || value.includes('C:') || value.includes('D:') || value.includes('/workspaces/') || value.startsWith('.')) {
        issues.push({ type: 'local_path', table: 'bosses', name: boss.name, field, value });
      }
      if (!value.startsWith('/assets/')) {
        issues.push({ type: 'invalid_url', table: 'bosses', name: boss.name, field, value });
      }
      const filePath = value.replace(/^\/assets\//, '');
      if (!fs.existsSync(path.join(ASSET_ROOT, filePath))) {
        issues.push({ type: 'missing_file', table: 'bosses', name: boss.name, field, value });
      }
    }
  }

  if (issues.length > 0) {
    console.warn(`[asset-audit] ${issues.length} problemas de asset detectados.`);
    console.warn(JSON.stringify(issues.slice(0, 15), null, 2));
  }

  return issues;
}

function syncAssetUrls(db) {
  const characters = db.prepare('SELECT id, name FROM characters ORDER BY id').all();
  const characterUpdate = db.prepare(`
    UPDATE characters
    SET image_url = ?, image_idle_url = ?, gif_attack_url = ?, gif_defend_url = ?, gif_skill_url = ?, gif_hit_url = ?, gif_victory_url = ?, gif_defeat_url = ?
    WHERE id = ?
  `);

  for (const character of characters) {
    const urls = getCharacterAssetUrls(character.name);
    characterUpdate.run(
      urls.image_url,
      urls.image_idle_url,
      urls.gif_attack_url,
      urls.gif_defend_url,
      urls.gif_skill_url,
      urls.gif_hit_url,
      urls.gif_victory_url,
      urls.gif_defeat_url,
      character.id,
    );
  }

  const bosses = db.prepare('SELECT id, name FROM bosses ORDER BY id').all();
  const bossUpdate = db.prepare(`
    UPDATE bosses
    SET image_url = ?, gif_attack_url = ?, gif_defend_url = ?, gif_skill_url = ?
    WHERE id = ?
  `);

  for (const boss of bosses) {
    const urls = getBossAssetUrls(boss.name);
    bossUpdate.run(
      urls.image_url,
      urls.gif_attack_url,
      urls.gif_defend_url,
      urls.gif_skill_url,
      boss.id,
    );
  }
}

module.exports = {
  ASSET_ROOT,
  normalizeAssetKey,
  getCharacterAssetUrls,
  getBossAssetUrls,
  syncAssetUrls,
  auditAssetUrls,
};
