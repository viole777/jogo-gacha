/**
 * Seed do banco de dados
 * Popula o catálogo de personagens, banners, bosses, evoluções e cria o admin
 *
 * Personagens exclusivos do admin (atributos máximos):
 * - Frieren (Sousou no Frieren) - A mais forte do sistema
 * - Gilgamesh (Fate/Extra CCC)
 * - Madoka (Madoka Magica)
 *
 * Escala de atributos exorbitantes:
 * common: 1k HP | rare: 10k | epic: 100k | legendary: 1m | mythic: 100m | secret: 10b
 * Admin: qd (quadrilhões)
 */

const db = require('./index');
const bcrypt = require('bcryptjs');
const { syncAssetUrls } = require('./assetCatalog');

// =============================================
// PERSONAGENS DO CATÁLOGO
// =============================================
const characters = [
  // ===== EXCLUSIVOS DO ADMIN (atributos máximos - qd) =====
  {
    name: 'Frieren',
    anime: 'Sousou no Frieren',
    rarity: 'secret',
    element: 'magia',
    role: 'attacker',
    base_hp: 5000000000000000,   // 5qd
    base_atk: 1200000000000000,  // 1.2qd
    base_def: 800000000000000,   // 800t
    base_speed: 999999,
    skill_name: 'Zoltraak Supremo',
    skill_description: 'Rajada de magia negra que causa dano massivo e ignora 50% da defesa.',
    is_admin_exclusive: 1,
    power_tier: 10,
  },
  {
    name: 'Gilgamesh',
    anime: 'Fate/Extra CCC',
    rarity: 'secret',
    element: 'tesouro',
    role: 'attacker',
    base_hp: 4800000000000000,   // 4.8qd
    base_atk: 1250000000000000,  // 1.25qd
    base_def: 750000000000000,   // 750t
    base_speed: 999998,
    skill_name: 'Enuma Elish',
    skill_description: 'Abre o Portal do Rei e libera a espada que separa céu e terra.',
    is_admin_exclusive: 1,
    power_tier: 10,
  },
  {
    name: 'Madoka Kaname',
    anime: 'Madoka Magica',
    rarity: 'secret',
    element: 'esperança',
    role: 'support',
    base_hp: 4500000000000000,   // 4.5qd
    base_atk: 1000000000000000,  // 1qd
    base_def: 900000000000000,   // 900t
    base_speed: 1000000,
    skill_name: 'Desejo Final',
    skill_description: 'Reescreve a realidade, curando todo o time e aumentando os atributos.',
    is_admin_exclusive: 1,
    power_tier: 10,
  },

  // ===== SECRET (10b) =====
  {
    name: 'Ichigo Kurosaki',
    anime: 'Bleach',
    rarity: 'secret',
    element: 'espiritual',
    role: 'attacker',
    base_hp: 10000000000,    // 10b
    base_atk: 1000000000,    // 1b
    base_def: 800000000,     // 800m
    base_speed: 950,
    skill_name: 'Getsuga Tensho Final',
    skill_description: 'Libera uma onda de energia espiritual em forma de lua crescente que corta tudo.',
    is_admin_exclusive: 0,
    power_tier: 9,
  },
  {
    name: 'Johan Liebert',
    anime: 'Monster',
    rarity: 'secret',
    element: 'psicológico',
    role: 'support',
    base_hp: 9000000000,     // 9b
    base_atk: 800000000,     // 800m
    base_def: 850000000,     // 850m
    base_speed: 980,
    skill_name: 'Manipulação Total',
    skill_description: 'Manipula a mente dos inimigos, reduzindo o ataque e a defesa deles.',
    is_admin_exclusive: 0,
    power_tier: 9,
  },
  {
    name: 'Jotaro Kujo',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'secret',
    element: 'stand',
    role: 'attacker',
    base_hp: 9500000000,     // 9.5b
    base_atk: 950000000,     // 950m
    base_def: 820000000,     // 820m
    base_speed: 970,
    skill_name: 'Star Platinum: The World Over Heaven',
    skill_description: 'Para o tempo e desfere uma rajada de socos que aniquila qualquer inimigo.',
    is_admin_exclusive: 0,
    power_tier: 9,
  },
  {
    name: 'Dio Brando',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'secret',
    element: 'vampiro',
    role: 'attacker',
    base_hp: 9800000000,     // 9.8b
    base_atk: 980000000,     // 980m
    base_def: 780000000,     // 780m
    base_speed: 990,
    skill_name: 'The World Over Heaven',
    skill_description: 'Para o tempo e reescreve a realidade com seus punhos.',
    is_admin_exclusive: 0,
    power_tier: 9,
  },
  {
    name: 'Giorno Giovanna',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'secret',
    element: 'stand',
    role: 'support',
    base_hp: 9200000000,     // 9.2b
    base_atk: 850000000,     // 850m
    base_def: 840000000,     // 840m
    base_speed: 960,
    skill_name: 'Gold Experience Requiem',
    skill_description: 'Anula qualquer ataque inimigo e devolve o dano infinitamente.',
    is_admin_exclusive: 0,
    power_tier: 9,
  },

  // ===== MÍTICOS (100m) =====
  {
    name: 'Rukia Kuchiki',
    anime: 'Bleach',
    rarity: 'mythic',
    element: 'gelo',
    role: 'attacker',
    base_hp: 100000000,      // 100m
    base_atk: 10000000,      // 10m
    base_def: 8000000,       // 8m
    base_speed: 880,
    skill_name: 'Bankai: Hakka no Togame',
    skill_description: 'Congela o inimigo até o zero absoluto, causando dano massivo.',
    is_admin_exclusive: 0,
    power_tier: 8,
  },
  {
    name: 'Aizen Sosuke',
    anime: 'Bleach',
    rarity: 'mythic',
    element: 'ilusão',
    role: 'support',
    base_hp: 110000000,      // 110m
    base_atk: 9500000,       // 9.5m
    base_def: 8500000,       // 8.5m
    base_speed: 900,
    skill_name: 'Kyoka Suigetsu',
    skill_description: 'Ilude os inimigos, reduzindo a precisão e o ataque deles.',
    is_admin_exclusive: 0,
    power_tier: 8,
  },
  {
    name: 'Fern',
    anime: 'Sousou no Frieren',
    rarity: 'mythic',
    element: 'magia',
    role: 'attacker',
    base_hp: 95000000,       // 95m
    base_atk: 10500000,      // 10.5m
    base_def: 7500000,       // 7.5m
    base_speed: 890,
    skill_name: 'Zoltraak Avançado',
    skill_description: 'Dispara magia ofensiva de alto dano com precisão absoluta.',
    is_admin_exclusive: 0,
    power_tier: 8,
  },
  {
    name: 'Stark',
    anime: 'Sousou no Frieren',
    rarity: 'mythic',
    element: 'guerreiro',
    role: 'tank',
    base_hp: 130000000,      // 130m
    base_atk: 8500000,       // 8.5m
    base_def: 12000000,      // 12m
    base_speed: 750,
    skill_name: 'Machado do Guerreiro Lendário',
    skill_description: 'Golpe poderoso que também aumenta a própria defesa.',
    is_admin_exclusive: 0,
    power_tier: 8,
  },
  {
    name: 'Joseph Joestar',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'mythic',
    element: 'hamon',
    role: 'support',
    base_hp: 90000000,       // 90m
    base_atk: 8800000,       // 8.8m
    base_def: 7800000,       // 7.8m
    base_speed: 870,
    skill_name: 'Hamon Overdrive Supremo',
    skill_description: 'Cura o time e causa dano a inimigos com energia Hamon.',
    is_admin_exclusive: 0,
    power_tier: 8,
  },
  {
    name: 'Kars',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'mythic',
    element: 'pillar',
    role: 'attacker',
    base_hp: 120000000,      // 120m
    base_atk: 9800000,       // 9.8m
    base_def: 9000000,       // 9m
    base_speed: 850,
    skill_name: 'Modo Supremo Definitivo',
    skill_description: 'Transforma os braços em lâminas e ataca em velocidade extrema.',
    is_admin_exclusive: 0,
    power_tier: 8,
  },

  // ===== LENDÁRIOS (1m) =====
  {
    name: 'Uryu Ishida',
    anime: 'Bleach',
    rarity: 'legendary',
    element: 'quincy',
    role: 'attacker',
    base_hp: 1000000,        // 1m
    base_atk: 100000,        // 100k
    base_def: 80000,         // 80k
    base_speed: 840,
    skill_name: 'Letzt Stil',
    skill_description: 'Chuva de flechas de energia espiritual devastadoras.',
    is_admin_exclusive: 0,
    power_tier: 7,
  },
  {
    name: 'Orihime Inoue',
    anime: 'Bleach',
    rarity: 'legendary',
    element: 'cura',
    role: 'support',
    base_hp: 1100000,        // 1.1m
    base_atk: 80000,         // 80k
    base_def: 90000,         // 90k
    base_speed: 800,
    skill_name: 'Santen Kesshun',
    skill_description: 'Barreira de cura que restaura a vida do time.',
    is_admin_exclusive: 0,
    power_tier: 7,
  },
  {
    name: 'Eisen',
    anime: 'Sousou no Frieren',
    rarity: 'legendary',
    element: 'anão',
    role: 'tank',
    base_hp: 1500000,        // 1.5m
    base_atk: 85000,         // 85k
    base_def: 120000,        // 120k
    base_speed: 700,
    skill_name: 'Machado Ancião',
    skill_description: 'Golpe pesado que reduz a defesa do inimigo.',
    is_admin_exclusive: 0,
    power_tier: 7,
  },
  {
    name: 'Caesar Zeppeli',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'legendary',
    element: 'hamon',
    role: 'attacker',
    base_hp: 950000,         // 950k
    base_atk: 95000,         // 95k
    base_def: 75000,         // 75k
    base_speed: 860,
    skill_name: 'Bubble Launcher',
    skill_description: 'Bolhas de Hamon que explodem no contato.',
    is_admin_exclusive: 0,
    power_tier: 7,
  },
  {
    name: 'Lisa Lisa',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'legendary',
    element: 'hamon',
    role: 'support',
    base_hp: 1000000,        // 1m
    base_atk: 88000,         // 88k
    base_def: 85000,         // 85k
    base_speed: 850,
    skill_name: 'Hamon Mastery',
    skill_description: 'Aumenta o ataque de todo o time com Hamon.',
    is_admin_exclusive: 0,
    power_tier: 7,
  },

  // ===== ÉPICOS (100k) =====
  {
    name: 'Renji Abarai',
    anime: 'Bleach',
    rarity: 'epic',
    element: 'espiritual',
    role: 'attacker',
    base_hp: 100000,         // 100k
    base_atk: 10000,         // 10k
    base_def: 8000,          // 8k
    base_speed: 780,
    skill_name: 'Bankai: Hihiō Zabimaru',
    skill_description: 'Espada serpente que ataca em movimento ondulante.',
    is_admin_exclusive: 0,
    power_tier: 5,
  },
  {
    name: 'Sein',
    anime: 'Sousou no Frieren',
    rarity: 'epic',
    element: 'sacerdote',
    role: 'support',
    base_hp: 110000,         // 110k
    base_atk: 8000,          // 8k
    base_def: 9000,          // 9k
    base_speed: 720,
    skill_name: 'Bênção Divina',
    skill_description: 'Cura um aliado e remove efeitos negativos.',
    is_admin_exclusive: 0,
    power_tier: 5,
  },
  {
    name: 'Speedwagon',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'epic',
    element: 'suporte',
    role: 'support',
    base_hp: 120000,         // 120k
    base_atk: 7500,          // 7.5k
    base_def: 9500,          // 9.5k
    base_speed: 750,
    skill_name: 'Chapéu Giratório',
    skill_description: 'Ataca com o chapéu e aumenta a defesa do time.',
    is_admin_exclusive: 0,
    power_tier: 5,
  },

  // ===== RAROS (10k) =====
  {
    name: 'Karin Kurosaki',
    anime: 'Bleach',
    rarity: 'rare',
    element: 'espiritual',
    role: 'support',
    base_hp: 10000,          // 10k
    base_atk: 1000,          // 1k
    base_def: 800,           // 800
    base_speed: 700,
    skill_name: 'Percepção Espiritual',
    skill_description: 'Detecta inimigos e aumenta a precisão do time.',
    is_admin_exclusive: 0,
    power_tier: 3,
  },
  {
    name: 'Kraft',
    anime: 'Sousou no Frieren',
    rarity: 'rare',
    element: 'guerreiro',
    role: 'tank',
    base_hp: 12000,          // 12k
    base_atk: 900,           // 900
    base_def: 1100,          // 1.1k
    base_speed: 600,
    skill_name: 'Golpe de Espada',
    skill_description: 'Ataque básico com espada.',
    is_admin_exclusive: 0,
    power_tier: 3,
  },
  {
    name: 'Erina Joestar',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'rare',
    element: 'suporte',
    role: 'support',
    base_hp: 11000,          // 11k
    base_atk: 850,           // 850
    base_def: 900,           // 900
    base_speed: 680,
    skill_name: 'Coragem',
    skill_description: 'Aumenta a moral do time, restaurando um pouco de vida.',
    is_admin_exclusive: 0,
    power_tier: 3,
  },

  // ===== COMUNS (1k) =====
  {
    name: 'Yuzu Kurosaki',
    anime: 'Bleach',
    rarity: 'common',
    element: 'espiritual',
    role: 'support',
    base_hp: 1000,           // 1k
    base_atk: 100,           // 100
    base_def: 80,            // 80
    base_speed: 650,
    skill_name: 'Cura Espiritual',
    skill_description: 'Restaura um pouco de vida de um aliado.',
    is_admin_exclusive: 0,
    power_tier: 1,
  },
  {
    name: 'Heiter',
    anime: 'Sousou no Frieren',
    rarity: 'common',
    element: 'sacerdote',
    role: 'support',
    base_hp: 1100,           // 1.1k
    base_atk: 90,            // 90
    base_def: 100,           // 100
    base_speed: 620,
    skill_name: 'Oração',
    skill_description: 'Cura um aliado com uma oração.',
    is_admin_exclusive: 0,
    power_tier: 1,
  },
  {
    name: 'Poco',
    anime: 'JoJo Bizarre Adventure',
    rarity: 'common',
    element: 'suporte',
    role: 'support',
    base_hp: 1050,           // 1.05k
    base_atk: 85,            // 85
    base_def: 90,            // 90
    base_speed: 640,
    skill_name: 'Fé',
    skill_description: 'Aumenta a defesa de um aliado.',
    is_admin_exclusive: 0,
    power_tier: 1,
  },
];

// =============================================
// BOSSES
// =============================================
const bosses = [
  // Bleach
  {
    name: 'Aizen Sosuke (Hogyoku)',
    anime: 'Bleach',
    hp: 500000000000,        // 500b
    atk: 50000000000,        // 50b
    def: 40000000000,        // 40b
    difficulty: 'nightmare',
  },
  {
    name: 'Ulquiorra Cifer',
    anime: 'Bleach',
    hp: 100000000000,        // 100b
    atk: 10000000000,        // 10b
    def: 8000000000,         // 8b
    difficulty: 'hard',
  },
  {
    name: 'Grimmjow Jaegerjaquez',
    anime: 'Bleach',
    hp: 50000000000,         // 50b
    atk: 5000000000,         // 5b
    def: 4000000000,         // 4b
    difficulty: 'normal',
  },
  // Frieren
  {
    name: 'Dragão Ancião',
    anime: 'Sousou no Frieren',
    hp: 80000000000,         // 80b
    atk: 8000000000,         // 8b
    def: 7000000000,         // 7b
    difficulty: 'hard',
  },
  {
    name: 'Demônio Qual',
    anime: 'Sousou no Frieren',
    hp: 30000000000,         // 30b
    atk: 3000000000,         // 3b
    def: 2500000000,         // 2.5b
    difficulty: 'normal',
  },
  {
    name: 'Lobo Demoníaco',
    anime: 'Sousou no Frieren',
    hp: 10000000000,         // 10b
    atk: 1000000000,         // 1b
    def: 800000000,          // 800m
    difficulty: 'easy',
  },
  // JoJo
  {
    name: 'Kars (Modo Supremo)',
    anime: 'JoJo Bizarre Adventure',
    hp: 600000000000,        // 600b
    atk: 60000000000,        // 60b
    def: 50000000000,        // 50b
    difficulty: 'nightmare',
  },
  {
    name: 'DIO (The World)',
    anime: 'JoJo Bizarre Adventure',
    hp: 200000000000,        // 200b
    atk: 20000000000,        // 20b
    def: 15000000000,        // 15b
    difficulty: 'hard',
  },
  {
    name: 'Esidisi',
    anime: 'JoJo Bizarre Adventure',
    hp: 40000000000,         // 40b
    atk: 4000000000,         // 4b
    def: 3000000000,         // 3b
    difficulty: 'normal',
  },
];

// =============================================
// BOSS DROPS
// =============================================
const bossDrops = [
  // Aizen drops
  { boss: 'Aizen Sosuke (Hogyoku)', drops: [
    { item: 'Fragmento de Hogyoku', rate: 0.10, qty: 1 },
    { item: 'Essência de Evolução Suprema', rate: 0.05, qty: 1 },
  ]},
  // Ulquiorra drops
  { boss: 'Ulquiorra Cifer', drops: [
    { item: 'Fragmento de Hollow', rate: 0.20, qty: 1 },
    { item: 'Lágrima de Hollow', rate: 0.10, qty: 1 },
  ]},
  // Grimmjow drops
  { boss: 'Grimmjow Jaegerjaquez', drops: [
    { item: 'Fragmento de Hollow', rate: 0.15, qty: 1 },
    { item: 'Garra de Pantera', rate: 0.08, qty: 1 },
  ]},
  // Dragão Ancião drops
  { boss: 'Dragão Ancião', drops: [
    { item: 'Escama de Dragão', rate: 0.20, qty: 1 },
    { item: 'Coração de Dragão', rate: 0.08, qty: 1 },
  ]},
  // Demônio Qual drops
  { boss: 'Demônio Qual', drops: [
    { item: 'Núcleo Demoníaco', rate: 0.15, qty: 1 },
  ]},
  // Lobo Demoníaco drops
  { boss: 'Lobo Demoníaco', drops: [
    { item: 'Pele de Lobo', rate: 0.25, qty: 1 },
  ]},
  // Kars drops
  { boss: 'Kars (Modo Supremo)', drops: [
    { item: 'Pedra Vermelha de Aja', rate: 0.10, qty: 1 },
    { item: 'Essência de Evolução Suprema', rate: 0.05, qty: 1 },
  ]},
  // DIO drops
  { boss: 'DIO (The World)', drops: [
    { item: 'Máscara de Pedra', rate: 0.20, qty: 1 },
    { item: 'Diário de DIO', rate: 0.08, qty: 1 },
  ]},
  // Esidisi drops
  { boss: 'Esidisi', drops: [
    { item: 'Fragmento de Pedra Vermelha', rate: 0.15, qty: 1 },
  ]},
];

// =============================================
// EVOLUÇÕES
// =============================================
const evolutions = [
  // Bleach
  { char: 'Ichigo Kurosaki', evo: 'Forma Vasto Lorde', item: 'Fragmento de Hollow', qty: 5, rarity: 'secret', mult: 2.0 },
  { char: 'Rukia Kuchiki', evo: 'Bankai: Hakka no Togame', item: 'Fragmento de Hogyoku', qty: 3, rarity: 'mythic', mult: 1.8 },
  { char: 'Uryu Ishida', evo: 'Letzt Stil', item: 'Lágrima de Hollow', qty: 3, rarity: 'legendary', mult: 1.6 },
  { char: 'Renji Abarai', evo: 'Bankai: Hihiō Zabimaru', item: 'Garra de Pantera', qty: 2, rarity: 'epic', mult: 1.5 },
  // Frieren
  { char: 'Fern', evo: 'Zoltraak Avançado', item: 'Núcleo Demoníaco', qty: 3, rarity: 'mythic', mult: 1.8 },
  { char: 'Stark', evo: 'Guerreiro Lendário', item: 'Escama de Dragão', qty: 3, rarity: 'mythic', mult: 1.7 },
  { char: 'Eisen', evo: 'Machado Ancião', item: 'Coração de Dragão', qty: 2, rarity: 'legendary', mult: 1.5 },
  // JoJo
  { char: 'Jotaro Kujo', evo: 'Star Platinum: The World', item: 'Diário de DIO', qty: 3, rarity: 'secret', mult: 2.0 },
  { char: 'Dio Brando', evo: 'The World Over Heaven', item: 'Máscara de Pedra', qty: 3, rarity: 'secret', mult: 2.0 },
  { char: 'Giorno Giovanna', evo: 'Gold Experience Requiem', item: 'Pedra Vermelha de Aja', qty: 3, rarity: 'secret', mult: 2.0 },
  { char: 'Joseph Joestar', evo: 'Hamon Overdrive Supremo', item: 'Fragmento de Pedra Vermelha', qty: 3, rarity: 'mythic', mult: 1.7 },
  { char: 'Kars', evo: 'Modo Supremo Definitivo', item: 'Pedra Vermelha de Aja', qty: 2, rarity: 'mythic', mult: 1.8 },
  { char: 'Caesar Zeppeli', evo: 'Bubble Launcher Supremo', item: 'Fragmento de Pedra Vermelha', qty: 2, rarity: 'legendary', mult: 1.5 },
];

// =============================================
// BANNERS
// =============================================
const banners = [
  {
    name: 'Banner Inaugural: Heróis Lendários',
    description: 'Personagens secretos, míticos e lendários de Bleach, Frieren e JoJo!',
    is_active: 1,
  },
  {
    name: 'Banner: Sombras de JoJo',
    description: 'Os vilões e heróis mais icônicos de JoJo Bizarre Adventure.',
    is_active: 1,
  },
];

// =============================================
// FUNÇÃO DE SEED
// =============================================
function seed() {
  const insertCharacter = db.prepare(`
    INSERT INTO characters (name, anime, rarity, element, role, base_hp, base_atk, base_def, base_speed, skill_name, skill_description, is_admin_exclusive, power_tier)
    VALUES (@name, @anime, @rarity, @element, @role, @base_hp, @base_atk, @base_def, @base_speed, @skill_name, @skill_description, @is_admin_exclusive, @power_tier)
  `);

  const insertBanner = db.prepare(`
    INSERT INTO banners (name, description, is_active)
    VALUES (@name, @description, @is_active)
  `);

  const insertBannerItem = db.prepare(`
    INSERT INTO banner_items (banner_id, character_id, drop_rate, is_rate_up)
    VALUES (?, ?, ?, ?)
  `);

  const insertAdmin = db.prepare(`
    INSERT INTO users (username, email, password_hash, gems, gold, is_admin)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const insertUserCharacter = db.prepare(`
    INSERT INTO user_characters (user_id, character_id, level, hp, max_hp, atk, def, speed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTeam = db.prepare(`
    INSERT INTO user_teams (user_id, user_character_id, slot)
    VALUES (?, ?, ?)
  `);

  const insertRanking = db.prepare(`
    INSERT INTO rankings (user_id, rating)
    VALUES (?, 1000)
  `);

  const insertBoss = db.prepare(`
    INSERT INTO bosses (name, anime, hp, atk, def, difficulty)
    VALUES (@name, @anime, @hp, @atk, @def, @difficulty)
  `);

  const insertBossDrop = db.prepare(`
    INSERT INTO boss_drops (boss_id, item_name, drop_rate, quantity)
    VALUES (?, ?, ?, ?)
  `);

  const insertEvolution = db.prepare(`
    INSERT INTO character_evolutions (character_id, evolution_name, required_item, required_quantity, new_rarity, stat_multiplier)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const countCharacters = db.prepare('SELECT COUNT(*) as count FROM characters').get();
  const countBanners = db.prepare('SELECT COUNT(*) as count FROM banners').get();
  const countUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const countBosses = db.prepare('SELECT COUNT(*) as count FROM bosses').get();
  const countEvolutions = db.prepare('SELECT COUNT(*) as count FROM character_evolutions').get();

  // Seed de personagens (apenas se a tabela estiver vazia)
  if (countCharacters.count === 0) {
    const insertAll = db.transaction(() => {
      for (const char of characters) {
        insertCharacter.run(char);
      }
    });
    insertAll();
    console.log(`✅ ${characters.length} personagens inseridos no catálogo`);
  }

  // Seed de banners (apenas se a tabela estiver vazia)
  if (countBanners.count === 0) {
    const insertAll = db.transaction(() => {
      for (const banner of banners) {
        insertBanner.run(banner);
      }
    });
    insertAll();
    console.log(`✅ ${banners.length} banners criados`);
  }

  // Associa personagens aos banners
  const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banner_items').get();
  if (bannerCount.count === 0) {
    const getBanner = db.prepare('SELECT id FROM banners WHERE name = ?');
    const getCharacter = db.prepare('SELECT id FROM characters WHERE name = ?');

    const banner1 = getBanner.get('Banner Inaugural: Heróis Lendários');
    const banner2 = getBanner.get('Banner: Sombras de JoJo');

    // Banner 1: misto com foco em secret/mítico/lendário
    const banner1Chars = [
      { name: 'Ichigo Kurosaki', rate: 0.005, rateUp: 1 },
      { name: 'Jotaro Kujo', rate: 0.005, rateUp: 1 },
      { name: 'Dio Brando', rate: 0.005, rateUp: 0 },
      { name: 'Giorno Giovanna', rate: 0.005, rateUp: 0 },
      { name: 'Johan Liebert', rate: 0.005, rateUp: 0 },
      { name: 'Rukia Kuchiki', rate: 0.02, rateUp: 0 },
      { name: 'Aizen Sosuke', rate: 0.02, rateUp: 0 },
      { name: 'Fern', rate: 0.02, rateUp: 0 },
      { name: 'Stark', rate: 0.02, rateUp: 0 },
      { name: 'Joseph Joestar', rate: 0.02, rateUp: 0 },
      { name: 'Kars', rate: 0.02, rateUp: 0 },
      { name: 'Uryu Ishida', rate: 0.05, rateUp: 0 },
      { name: 'Orihime Inoue', rate: 0.05, rateUp: 0 },
      { name: 'Eisen', rate: 0.05, rateUp: 0 },
      { name: 'Caesar Zeppeli', rate: 0.05, rateUp: 0 },
      { name: 'Lisa Lisa', rate: 0.05, rateUp: 0 },
      { name: 'Renji Abarai', rate: 0.08, rateUp: 0 },
      { name: 'Sein', rate: 0.08, rateUp: 0 },
      { name: 'Speedwagon', rate: 0.08, rateUp: 0 },
      { name: 'Karin Kurosaki', rate: 0.10, rateUp: 0 },
      { name: 'Kraft', rate: 0.10, rateUp: 0 },
      { name: 'Erina Joestar', rate: 0.10, rateUp: 0 },
      { name: 'Yuzu Kurosaki', rate: 0.10, rateUp: 0 },
      { name: 'Heiter', rate: 0.10, rateUp: 0 },
      { name: 'Poco', rate: 0.10, rateUp: 0 },
    ];

    // Banner 2: foco em JoJo
    const banner2Chars = [
      { name: 'Jotaro Kujo', rate: 0.01, rateUp: 1 },
      { name: 'Dio Brando', rate: 0.01, rateUp: 1 },
      { name: 'Giorno Giovanna', rate: 0.01, rateUp: 0 },
      { name: 'Joseph Joestar', rate: 0.04, rateUp: 0 },
      { name: 'Kars', rate: 0.04, rateUp: 0 },
      { name: 'Caesar Zeppeli', rate: 0.08, rateUp: 0 },
      { name: 'Lisa Lisa', rate: 0.08, rateUp: 0 },
      { name: 'Speedwagon', rate: 0.12, rateUp: 0 },
      { name: 'Erina Joestar', rate: 0.15, rateUp: 0 },
      { name: 'Poco', rate: 0.15, rateUp: 0 },
    ];

    const insertAll = db.transaction(() => {
      for (const item of banner1Chars) {
        const char = getCharacter.get(item.name);
        if (char) {
          insertBannerItem.run(banner1.id, char.id, item.rate, item.rateUp);
        }
      }
      for (const item of banner2Chars) {
        const char = getCharacter.get(item.name);
        if (char) {
          insertBannerItem.run(banner2.id, char.id, item.rate, item.rateUp);
        }
      }
    });
    insertAll();
    console.log('✅ Itens dos banners associados');
  }

  const newCharacterNames = [
    'Naruto Uzumaki', 'Sasuke Uchiha', 'Monkey D. Luffy', 'Roronoa Zoro',
    'Tanjiro Kamado', 'Nezuko Kamado', 'Satoru Gojo', 'Yuji Itadori',
    'Goku', 'Vegeta', 'Saitama', 'Genos', 'Eren Yeager', 'Mikasa Ackerman',
    'Kirito', 'Asuna',
  ];
  const namePlaceholders = newCharacterNames.map(() => '?').join(', ');
  const newCharacterIds = db
    .prepare(`SELECT id FROM characters WHERE name IN (${namePlaceholders})`)
    .all(...newCharacterNames)
    .map((character) => character.id);
  const idPlaceholders = newCharacterIds.map(() => '?').join(', ');

  if (newCharacterIds.length > 0) {
    db.transaction(() => {
      db.prepare(`DELETE FROM user_teams WHERE user_character_id IN (SELECT id FROM user_characters WHERE character_id IN (${idPlaceholders}))`).run(...newCharacterIds);
      db.prepare(`DELETE FROM user_characters WHERE character_id IN (${idPlaceholders})`).run(...newCharacterIds);
      db.prepare(`DELETE FROM banner_items WHERE character_id IN (${idPlaceholders})`).run(...newCharacterIds);
      db.prepare(`DELETE FROM character_evolutions WHERE character_id IN (${idPlaceholders})`).run(...newCharacterIds);
      db.prepare(`DELETE FROM characters WHERE id IN (${idPlaceholders})`).run(...newCharacterIds);
    })();
  }

  db.prepare(
    `UPDATE banners SET is_active = 1 WHERE name = 'Banner Inaugural: Heróis Lendários'`
  ).run();
  db.prepare(
    `DELETE FROM banners WHERE name LIKE 'Banner Temático:%'`
  ).run();

  // Seed de bosses
  if (countBosses.count === 0) {
    const insertAll = db.transaction(() => {
      for (const boss of bosses) {
        insertBoss.run(boss);
      }
    });
    insertAll();
    console.log(`✅ ${bosses.length} bosses criados`);
  }

  // Corrige as URLs de imagem/GIF usando somente os assets reais do projeto
  syncAssetUrls(db);

  // Associa drops aos bosses
  const dropCount = db.prepare('SELECT COUNT(*) as count FROM boss_drops').get();
  if (dropCount.count === 0) {
    const getBoss = db.prepare('SELECT id FROM bosses WHERE name = ?');
    const insertAll = db.transaction(() => {
      for (const boss of bossDrops) {
        const bossRow = getBoss.get(boss.boss);
        if (bossRow) {
          for (const drop of boss.drops) {
            insertBossDrop.run(bossRow.id, drop.item, drop.rate, drop.qty);
          }
        }
      }
    });
    insertAll();
    console.log('✅ Drops dos bosses associados');
  }

  // Seed de evoluções
  if (countEvolutions.count === 0) {
    const getCharacter = db.prepare('SELECT id FROM characters WHERE name = ?');
    const insertAll = db.transaction(() => {
      for (const evo of evolutions) {
        const char = getCharacter.get(evo.char);
        if (char) {
          insertEvolution.run(char.id, evo.evo, evo.item, evo.qty, evo.rarity, evo.mult);
        }
      }
    });
    insertAll();
    console.log(`✅ ${evolutions.length} evoluções criadas`);
  }

  // Cria o admin (apenas se não existir)
  if (countUsers.count === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'G@ch@Adm!n2026#Frieren';
    const passwordHash = bcrypt.hashSync(adminPassword, 10);

    const adminId = insertAdmin.run('admin', 'admin@gacha.com', passwordHash, 999999999, 999999999).lastInsertRowid;

    // Atribui os 3 personagens exclusivos ao admin
    const getExclusive = db.prepare(`
      SELECT id, base_hp, base_atk, base_def, base_speed FROM characters
      WHERE is_admin_exclusive = 1
    `);
    const exclusives = getExclusive.all();

    const insertAll = db.transaction(() => {
      let slot = 1;
      for (const char of exclusives) {
        const maxHp = char.base_hp * 2;
        const result = insertUserCharacter.run(adminId, char.id, 100, maxHp, maxHp, char.base_atk * 2, char.base_def * 2, char.base_speed * 2);
        insertTeam.run(adminId, result.lastInsertRowid, slot);
        slot++;
      }
      insertRanking.run(adminId);
    });
    insertAll();

    console.log(`✅ Admin criado com ${exclusives.length} personagens exclusivos (Frieren, Gilgamesh, Madoka)`);
    console.log('   Email: admin@gacha.com');
    console.log('   Senha: G@ch@Adm!n2026#Frieren (altere no .env)');
  }

  // Itens iniciais de boas-vindas para qualquer usuário sem alimentos
  const usersWithoutFood = db
    .prepare(
      `SELECT u.id FROM users u
       WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.user_id = u.id AND i.item_type = 'food')`
    )
    .all();

  const insertStarterItem = db.prepare(
    `INSERT INTO inventory (user_id, item_name, item_type, quantity, rarity, stats)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertStarterAll = db.transaction(() => {
    for (const u of usersWithoutFood) {
      insertStarterItem.run(u.id, '🍜 Miojo Ramen', 'food', 3, 'common', JSON.stringify({ xp: 150, heal_percent: 25 }));
      insertStarterItem.run(u.id, '🍖 Picanha do Anja', 'food', 1, 'rare', JSON.stringify({ xp: 500, heal_percent: 40 }));
      insertStarterItem.run(u.id, 'Poção de Cura', 'potion', 2, 'common', JSON.stringify({ heal: 100000 }));
    }
  });
  insertStarterAll();
  if (usersWithoutFood.length > 0) {
    console.log(`🎁 Itens iniciais dados a ${usersWithoutFood.length} usuário(s)`);
  }
}


module.exports = seed;

// Executa o seed se chamado diretamente
if (require.main === module) {
  seed();
  console.log('🌱 Seed concluído!');
}


module.exports = seed;

// Executa o seed se chamado diretamente
if (require.main === module) {
  seed();
  console.log('🌱 Seed concluído!');
}
