"""
Seed do banco de dados - replica server/database/seed.js
Popula catálogo de personagens, banners, bosses, evoluções e cria admin
"""

import bcrypt
from .database import db

# =============================================
# PERSONAGENS DO CATÁLOGO
# =============================================
CHARACTERS = [
    # ===== EXCLUSIVOS DO ADMIN (atributos máximos - qd) =====
    {
        'name': 'Frieren', 'anime': 'Sousou no Frieren', 'rarity': 'secret',
        'element': 'magia', 'role': 'attacker',
        'base_hp': 5000000000000000, 'base_atk': 1200000000000000,
        'base_def': 800000000000000, 'base_speed': 999999,
        'skill_name': 'Zoltraak Supremo',
        'skill_description': 'Rajada de magia negra que causa dano massivo e ignora 50% da defesa.',
        'is_admin_exclusive': 1, 'power_tier': 10,
    },
    {
        'name': 'Gilgamesh', 'anime': 'Fate/Extra CCC', 'rarity': 'secret',
        'element': 'tesouro', 'role': 'attacker',
        'base_hp': 4800000000000000, 'base_atk': 1250000000000000,
        'base_def': 750000000000000, 'base_speed': 999998,
        'skill_name': 'Enuma Elish',
        'skill_description': 'Abre o Portal do Rei e libera a espada que separa céu e terra.',
        'is_admin_exclusive': 1, 'power_tier': 10,
    },
    {
        'name': 'Madoka Kaname', 'anime': 'Madoka Magica', 'rarity': 'secret',
        'element': 'esperança', 'role': 'support',
        'base_hp': 4500000000000000, 'base_atk': 1000000000000000,
        'base_def': 900000000000000, 'base_speed': 1000000,
        'skill_name': 'Desejo Final',
        'skill_description': 'Reescreve a realidade, curando todo o time e aumentando os atributos.',
        'is_admin_exclusive': 1, 'power_tier': 10,
    },

    # ===== SECRET (10b) =====
    {
        'name': 'Ichigo Kurosaki', 'anime': 'Bleach', 'rarity': 'secret',
        'element': 'espiritual', 'role': 'attacker',
        'base_hp': 10000000000, 'base_atk': 1000000000,
        'base_def': 800000000, 'base_speed': 950,
        'skill_name': 'Getsuga Tensho Final',
        'skill_description': 'Libera uma onda de energia espiritual em forma de lua crescente que corta tudo.',
        'is_admin_exclusive': 0, 'power_tier': 9,
    },
    {
        'name': 'Johan Liebert', 'anime': 'Monster', 'rarity': 'secret',
        'element': 'psicológico', 'role': 'support',
        'base_hp': 9000000000, 'base_atk': 800000000,
        'base_def': 850000000, 'base_speed': 980,
        'skill_name': 'Manipulação Total',
        'skill_description': 'Manipula a mente dos inimigos, reduzindo o ataque e a defesa deles.',
        'is_admin_exclusive': 0, 'power_tier': 9,
    },
    {
        'name': 'Jotaro Kujo', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'secret',
        'element': 'stand', 'role': 'attacker',
        'base_hp': 9500000000, 'base_atk': 950000000,
        'base_def': 820000000, 'base_speed': 970,
        'skill_name': 'Star Platinum: The World Over Heaven',
        'skill_description': 'Para o tempo e desfere uma rajada de socos que aniquila qualquer inimigo.',
        'is_admin_exclusive': 0, 'power_tier': 9,
    },
    {
        'name': 'Dio Brando', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'secret',
        'element': 'vampiro', 'role': 'attacker',
        'base_hp': 9800000000, 'base_atk': 980000000,
        'base_def': 780000000, 'base_speed': 990,
        'skill_name': 'The World Over Heaven',
        'skill_description': 'Para o tempo e reescreve a realidade com seus punhos.',
        'is_admin_exclusive': 0, 'power_tier': 9,
    },
    {
        'name': 'Giorno Giovanna', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'secret',
        'element': 'stand', 'role': 'support',
        'base_hp': 9200000000, 'base_atk': 850000000,
        'base_def': 840000000, 'base_speed': 960,
        'skill_name': 'Gold Experience Requiem',
        'skill_description': 'Anula qualquer ataque inimigo e devolve o dano infinitamente.',
        'is_admin_exclusive': 0, 'power_tier': 9,
    },

    # ===== MÍTICOS (100m) =====
    {
        'name': 'Rukia Kuchiki', 'anime': 'Bleach', 'rarity': 'mythic',
        'element': 'gelo', 'role': 'attacker',
        'base_hp': 100000000, 'base_atk': 10000000,
        'base_def': 8000000, 'base_speed': 880,
        'skill_name': 'Bankai: Hakka no Togame',
        'skill_description': 'Congela o inimigo até o zero absoluto, causando dano massivo.',
        'is_admin_exclusive': 0, 'power_tier': 8,
    },
    {
        'name': 'Aizen Sosuke', 'anime': 'Bleach', 'rarity': 'mythic',
        'element': 'ilusão', 'role': 'support',
        'base_hp': 110000000, 'base_atk': 9500000,
        'base_def': 8500000, 'base_speed': 900,
        'skill_name': 'Kyoka Suigetsu',
        'skill_description': 'Ilude os inimigos, reduzindo a precisão e o ataque deles.',
        'is_admin_exclusive': 0, 'power_tier': 8,
    },
    {
        'name': 'Fern', 'anime': 'Sousou no Frieren', 'rarity': 'mythic',
        'element': 'magia', 'role': 'attacker',
        'base_hp': 95000000, 'base_atk': 10500000,
        'base_def': 7500000, 'base_speed': 890,
        'skill_name': 'Zoltraak Avançado',
        'skill_description': 'Dispara magia ofensiva de alto dano com precisão absoluta.',
        'is_admin_exclusive': 0, 'power_tier': 8,
    },
    {
        'name': 'Stark', 'anime': 'Sousou no Frieren', 'rarity': 'mythic',
        'element': 'guerreiro', 'role': 'tank',
        'base_hp': 130000000, 'base_atk': 8500000,
        'base_def': 12000000, 'base_speed': 750,
        'skill_name': 'Machado do Guerreiro Lendário',
        'skill_description': 'Golpe poderoso que também aumenta a própria defesa.',
        'is_admin_exclusive': 0, 'power_tier': 8,
    },
    {
        'name': 'Joseph Joestar', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'mythic',
        'element': 'hamon', 'role': 'support',
        'base_hp': 90000000, 'base_atk': 8800000,
        'base_def': 7800000, 'base_speed': 870,
        'skill_name': 'Hamon Overdrive Supremo',
        'skill_description': 'Cura o time e causa dano a inimigos com energia Hamon.',
        'is_admin_exclusive': 0, 'power_tier': 8,
    },
    {
        'name': 'Kars', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'mythic',
        'element': 'pillar', 'role': 'attacker',
        'base_hp': 120000000, 'base_atk': 9800000,
        'base_def': 9000000, 'base_speed': 850,
        'skill_name': 'Modo Supremo Definitivo',
        'skill_description': 'Transforma os braços em lâminas e ataca em velocidade extrema.',
        'is_admin_exclusive': 0, 'power_tier': 8,
    },

    # ===== LENDÁRIOS (1m) =====
    {
        'name': 'Uryu Ishida', 'anime': 'Bleach', 'rarity': 'legendary',
        'element': 'quincy', 'role': 'attacker',
        'base_hp': 1000000, 'base_atk': 100000,
        'base_def': 80000, 'base_speed': 840,
        'skill_name': 'Letzt Stil',
        'skill_description': 'Chuva de flechas de energia espiritual devastadoras.',
        'is_admin_exclusive': 0, 'power_tier': 7,
    },
    {
        'name': 'Orihime Inoue', 'anime': 'Bleach', 'rarity': 'legendary',
        'element': 'cura', 'role': 'support',
        'base_hp': 1100000, 'base_atk': 80000,
        'base_def': 90000, 'base_speed': 800,
        'skill_name': 'Santen Kesshun',
        'skill_description': 'Barreira de cura que restaura a vida do time.',
        'is_admin_exclusive': 0, 'power_tier': 7,
    },
    {
        'name': 'Eisen', 'anime': 'Sousou no Frieren', 'rarity': 'legendary',
        'element': 'anão', 'role': 'tank',
        'base_hp': 1500000, 'base_atk': 85000,
        'base_def': 120000, 'base_speed': 700,
        'skill_name': 'Machado Ancião',
        'skill_description': 'Golpe pesado que reduz a defesa do inimigo.',
        'is_admin_exclusive': 0, 'power_tier': 7,
    },
    {
        'name': 'Caesar Zeppeli', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'legendary',
        'element': 'hamon', 'role': 'attacker',
        'base_hp': 950000, 'base_atk': 95000,
        'base_def': 75000, 'base_speed': 860,
        'skill_name': 'Bubble Launcher',
        'skill_description': 'Bolhas de Hamon que explodem no contato.',
        'is_admin_exclusive': 0, 'power_tier': 7,
    },
    {
        'name': 'Lisa Lisa', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'legendary',
        'element': 'hamon', 'role': 'support',
        'base_hp': 1000000, 'base_atk': 88000,
        'base_def': 85000, 'base_speed': 850,
        'skill_name': 'Hamon Mastery',
        'skill_description': 'Aumenta o ataque de todo o time com Hamon.',
        'is_admin_exclusive': 0, 'power_tier': 7,
    },

    # ===== ÉPICOS (100k) =====
    {
        'name': 'Renji Abarai', 'anime': 'Bleach', 'rarity': 'epic',
        'element': 'espiritual', 'role': 'attacker',
        'base_hp': 100000, 'base_atk': 10000,
        'base_def': 8000, 'base_speed': 780,
        'skill_name': 'Bankai: Hihiō Zabimaru',
        'skill_description': 'Espada serpente que ataca em movimento ondulante.',
        'is_admin_exclusive': 0, 'power_tier': 5,
    },
    {
        'name': 'Sein', 'anime': 'Sousou no Frieren', 'rarity': 'epic',
        'element': 'sacerdote', 'role': 'support',
        'base_hp': 110000, 'base_atk': 8000,
        'base_def': 9000, 'base_speed': 720,
        'skill_name': 'Bênção Divina',
        'skill_description': 'Cura um aliado e remove efeitos negativos.',
        'is_admin_exclusive': 0, 'power_tier': 5,
    },
    {
        'name': 'Speedwagon', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'epic',
        'element': 'suporte', 'role': 'support',
        'base_hp': 120000, 'base_atk': 7500,
        'base_def': 9500, 'base_speed': 750,
        'skill_name': 'Chapéu Giratório',
        'skill_description': 'Ataca com o chapéu e aumenta a defesa do time.',
        'is_admin_exclusive': 0, 'power_tier': 5,
    },

    # ===== RAROS (10k) =====
    {
        'name': 'Karin Kurosaki', 'anime': 'Bleach', 'rarity': 'rare',
        'element': 'espiritual', 'role': 'support',
        'base_hp': 10000, 'base_atk': 1000,
        'base_def': 800, 'base_speed': 700,
        'skill_name': 'Percepção Espiritual',
        'skill_description': 'Detecta inimigos e aumenta a precisão do time.',
        'is_admin_exclusive': 0, 'power_tier': 3,
    },
    {
        'name': 'Kraft', 'anime': 'Sousou no Frieren', 'rarity': 'rare',
        'element': 'guerreiro', 'role': 'tank',
        'base_hp': 12000, 'base_atk': 900,
        'base_def': 1100, 'base_speed': 600,
        'skill_name': 'Golpe de Espada',
        'skill_description': 'Ataque básico com espada.',
        'is_admin_exclusive': 0, 'power_tier': 3,
    },
    {
        'name': 'Erina Joestar', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'rare',
        'element': 'suporte', 'role': 'support',
        'base_hp': 11000, 'base_atk': 850,
        'base_def': 900, 'base_speed': 680,
        'skill_name': 'Coragem',
        'skill_description': 'Aumenta a moral do time, restaurando um pouco de vida.',
        'is_admin_exclusive': 0, 'power_tier': 3,
    },

    # ===== COMUNS (1k) =====
    {
        'name': 'Yuzu Kurosaki', 'anime': 'Bleach', 'rarity': 'common',
        'element': 'espiritual', 'role': 'support',
        'base_hp': 1000, 'base_atk': 100,
        'base_def': 80, 'base_speed': 650,
        'skill_name': 'Cura Espiritual',
        'skill_description': 'Restaura um pouco de vida de um aliado.',
        'is_admin_exclusive': 0, 'power_tier': 1,
    },
    {
        'name': 'Heiter', 'anime': 'Sousou no Frieren', 'rarity': 'common',
        'element': 'sacerdote', 'role': 'support',
        'base_hp': 1100, 'base_atk': 90,
        'base_def': 100, 'base_speed': 620,
        'skill_name': 'Oração',
        'skill_description': 'Cura um aliado com uma oração.',
        'is_admin_exclusive': 0, 'power_tier': 1,
    },
    {
        'name': 'Poco', 'anime': 'JoJo Bizarre Adventure', 'rarity': 'common',
        'element': 'suporte', 'role': 'support',
        'base_hp': 1050, 'base_atk': 85,
        'base_def': 90, 'base_speed': 640,
        'skill_name': 'Fé',
        'skill_description': 'Aumenta a defesa de um aliado.',
        'is_admin_exclusive': 0, 'power_tier': 1,
    },
]

# =============================================
# BOSSES
# =============================================
BOSSES = [
    {'name': 'Aizen Sosuke (Hogyoku)', 'anime': 'Bleach', 'hp': 500000000000, 'atk': 50000000000, 'def': 40000000000, 'difficulty': 'nightmare'},
    {'name': 'Ulquiorra Cifer', 'anime': 'Bleach', 'hp': 100000000000, 'atk': 10000000000, 'def': 8000000000, 'difficulty': 'hard'},
    {'name': 'Grimmjow Jaegerjaquez', 'anime': 'Bleach', 'hp': 50000000000, 'atk': 5000000000, 'def': 4000000000, 'difficulty': 'normal'},
    {'name': 'Dragão Ancião', 'anime': 'Sousou no Frieren', 'hp': 80000000000, 'atk': 8000000000, 'def': 7000000000, 'difficulty': 'hard'},
    {'name': 'Demônio Qual', 'anime': 'Sousou no Frieren', 'hp': 30000000000, 'atk': 3000000000, 'def': 2500000000, 'difficulty': 'normal'},
    {'name': 'Lobo Demoníaco', 'anime': 'Sousou no Frieren', 'hp': 10000000000, 'atk': 1000000000, 'def': 800000000, 'difficulty': 'easy'},
    {'name': 'Kars (Modo Supremo)', 'anime': 'JoJo Bizarre Adventure', 'hp': 600000000000, 'atk': 60000000000, 'def': 50000000000, 'difficulty': 'nightmare'},
    {'name': 'DIO (The World)', 'anime': 'JoJo Bizarre Adventure', 'hp': 200000000000, 'atk': 20000000000, 'def': 15000000000, 'difficulty': 'hard'},
    {'name': 'Esidisi', 'anime': 'JoJo Bizarre Adventure', 'hp': 40000000000, 'atk': 4000000000, 'def': 3000000000, 'difficulty': 'normal'},
]

# =============================================
# BOSS DROPS
# =============================================
BOSS_DROPS = {
    'Aizen Sosuke (Hogyoku)': [
        {'item': 'Fragmento de Hogyoku', 'rate': 0.10, 'qty': 1},
        {'item': 'Essência de Evolução Suprema', 'rate': 0.05, 'qty': 1},
    ],
    'Ulquiorra Cifer': [
        {'item': 'Fragmento de Hollow', 'rate': 0.20, 'qty': 1},
        {'item': 'Lágrima de Hollow', 'rate': 0.10, 'qty': 1},
    ],
    'Grimmjow Jaegerjaquez': [
        {'item': 'Fragmento de Hollow', 'rate': 0.15, 'qty': 1},
        {'item': 'Garra de Pantera', 'rate': 0.08, 'qty': 1},
    ],
    'Dragão Ancião': [
        {'item': 'Escama de Dragão', 'rate': 0.20, 'qty': 1},
        {'item': 'Coração de Dragão', 'rate': 0.08, 'qty': 1},
    ],
    'Demônio Qual': [
        {'item': 'Núcleo Demoníaco', 'rate': 0.15, 'qty': 1},
    ],
    'Lobo Demoníaco': [
        {'item': 'Pele de Lobo', 'rate': 0.25, 'qty': 1},
    ],
    'Kars (Modo Supremo)': [
        {'item': 'Pedra Vermelha de Aja', 'rate': 0.10, 'qty': 1},
        {'item': 'Essência de Evolução Suprema', 'rate': 0.05, 'qty': 1},
    ],
    'DIO (The World)': [
        {'item': 'Máscara de Pedra', 'rate': 0.20, 'qty': 1},
        {'item': 'Diário de DIO', 'rate': 0.08, 'qty': 1},
    ],
    'Esidisi': [
        {'item': 'Fragmento de Pedra Vermelha', 'rate': 0.15, 'qty': 1},
    ],
}

# =============================================
# EVOLUÇÕES
# =============================================
EVOLUTIONS = [
    {'char': 'Ichigo Kurosaki', 'evo': 'Forma Vasto Lorde', 'item': 'Fragmento de Hollow', 'qty': 5, 'rarity': 'secret', 'mult': 2.0},
    {'char': 'Rukia Kuchiki', 'evo': 'Bankai: Hakka no Togame', 'item': 'Fragmento de Hogyoku', 'qty': 3, 'rarity': 'mythic', 'mult': 1.8},
    {'char': 'Uryu Ishida', 'evo': 'Letzt Stil', 'item': 'Lágrima de Hollow', 'qty': 3, 'rarity': 'legendary', 'mult': 1.6},
    {'char': 'Renji Abarai', 'evo': 'Bankai: Hihiō Zabimaru', 'item': 'Garra de Pantera', 'qty': 2, 'rarity': 'epic', 'mult': 1.5},
    {'char': 'Fern', 'evo': 'Zoltraak Avançado', 'item': 'Núcleo Demoníaco', 'qty': 3, 'rarity': 'mythic', 'mult': 1.8},
    {'char': 'Stark', 'evo': 'Guerreiro Lendário', 'item': 'Escama de Dragão', 'qty': 3, 'rarity': 'mythic', 'mult': 1.7},
    {'char': 'Eisen', 'evo': 'Machado Ancião', 'item': 'Coração de Dragão', 'qty': 2, 'rarity': 'legendary', 'mult': 1.5},
    {'char': 'Jotaro Kujo', 'evo': 'Star Platinum: The World', 'item': 'Diário de DIO', 'qty': 3, 'rarity': 'secret', 'mult': 2.0},
    {'char': 'Dio Brando', 'evo': 'The World Over Heaven', 'item': 'Máscara de Pedra', 'qty': 3, 'rarity': 'secret', 'mult': 2.0},
    {'char': 'Giorno Giovanna', 'evo': 'Gold Experience Requiem', 'item': 'Pedra Vermelha de Aja', 'qty': 3, 'rarity': 'secret', 'mult': 2.0},
    {'char': 'Joseph Joestar', 'evo': 'Hamon Overdrive Supremo', 'item': 'Fragmento de Pedra Vermelha', 'qty': 3, 'rarity': 'mythic', 'mult': 1.7},
    {'char': 'Kars', 'evo': 'Modo Supremo Definitivo', 'item': 'Pedra Vermelha de Aja', 'qty': 2, 'rarity': 'mythic', 'mult': 1.8},
    {'char': 'Caesar Zeppeli', 'evo': 'Bubble Launcher Supremo', 'item': 'Fragmento de Pedra Vermelha', 'qty': 2, 'rarity': 'legendary', 'mult': 1.5},
]

# =============================================
# BANNERS
# =============================================
BANNERS = [
    {'name': 'Banner Inaugural: Heróis Lendários', 'description': 'Personagens secretos, míticos e lendários de Bleach, Frieren e JoJo!', 'is_active': 1},
    {'name': 'Banner: Sombras de JoJo', 'description': 'Os vilões e heróis mais icônicos de JoJo Bizarre Adventure.', 'is_active': 1},
]

BANNER1_CHARS = [
    {'name': 'Ichigo Kurosaki', 'rate': 0.005, 'rateUp': 1},
    {'name': 'Jotaro Kujo', 'rate': 0.005, 'rateUp': 1},
    {'name': 'Dio Brando', 'rate': 0.005, 'rateUp': 0},
    {'name': 'Giorno Giovanna', 'rate': 0.005, 'rateUp': 0},
    {'name': 'Johan Liebert', 'rate': 0.005, 'rateUp': 0},
    {'name': 'Rukia Kuchiki', 'rate': 0.02, 'rateUp': 0},
    {'name': 'Aizen Sosuke', 'rate': 0.02, 'rateUp': 0},
    {'name': 'Fern', 'rate': 0.02, 'rateUp': 0},
    {'name': 'Stark', 'rate': 0.02, 'rateUp': 0},
    {'name': 'Joseph Joestar', 'rate': 0.02, 'rateUp': 0},
    {'name': 'Kars', 'rate': 0.02, 'rateUp': 0},
    {'name': 'Uryu Ishida', 'rate': 0.05, 'rateUp': 0},
    {'name': 'Orihime Inoue', 'rate': 0.05, 'rateUp': 0},
    {'name': 'Eisen', 'rate': 0.05, 'rateUp': 0},
    {'name': 'Caesar Zeppeli', 'rate': 0.05, 'rateUp': 0},
    {'name': 'Lisa Lisa', 'rate': 0.05, 'rateUp': 0},
    {'name': 'Renji Abarai', 'rate': 0.08, 'rateUp': 0},
    {'name': 'Sein', 'rate': 0.08, 'rateUp': 0},
    {'name': 'Speedwagon', 'rate': 0.08, 'rateUp': 0},
    {'name': 'Karin Kurosaki', 'rate': 0.10, 'rateUp': 0},
    {'name': 'Kraft', 'rate': 0.10, 'rateUp': 0},
    {'name': 'Erina Joestar', 'rate': 0.10, 'rateUp': 0},
    {'name': 'Yuzu Kurosaki', 'rate': 0.10, 'rateUp': 0},
    {'name': 'Heiter', 'rate': 0.10, 'rateUp': 0},
    {'name': 'Poco', 'rate': 0.10, 'rateUp': 0},
]

BANNER2_CHARS = [
    {'name': 'Jotaro Kujo', 'rate': 0.01, 'rateUp': 1},
    {'name': 'Dio Brando', 'rate': 0.01, 'rateUp': 1},
    {'name': 'Giorno Giovanna', 'rate': 0.01, 'rateUp': 0},
    {'name': 'Joseph Joestar', 'rate': 0.04, 'rateUp': 0},
    {'name': 'Kars', 'rate': 0.04, 'rateUp': 0},
    {'name': 'Caesar Zeppeli', 'rate': 0.08, 'rateUp': 0},
    {'name': 'Lisa Lisa', 'rate': 0.08, 'rateUp': 0},
    {'name': 'Speedwagon', 'rate': 0.12, 'rateUp': 0},
    {'name': 'Erina Joestar', 'rate': 0.15, 'rateUp': 0},
    {'name': 'Poco', 'rate': 0.15, 'rateUp': 0},
]

# =============================================
# MISSÕES
# =============================================
MISSIONS = [
    # Diárias
    ['Puxar no Gacha', 'Faça 1 pull em qualquer banner', 'daily', 'pull', 1, 20, 200],
    ['Puxar 5x no Gacha', 'Faça 5 pulls em qualquer banner', 'daily', 'pull', 5, 50, 500],
    ['Derrote um Boss', 'Vença 1 batalha de boss', 'daily', 'boss', 1, 30, 300],
    ['Alimente um Personagem', 'Use 1 alimento em um personagem', 'daily', 'feed', 1, 20, 200],
    ['Evolua um Personagem', 'Evolua 1 personagem', 'daily', 'evolve', 1, 50, 500],
    ['Batalha PvP', 'Participe de 1 batalha PvP', 'daily', 'pvp', 1, 40, 400],
    # Semanais
    ['Colecionador', 'Puxe 20 personagens', 'weekly', 'pull', 20, 200, 2000],
    ['Caçador de Bosses', 'Derrote 5 bosses', 'weekly', 'boss', 5, 300, 3000],
    ['Gladiador', 'Vença 5 batalhas PvP', 'weekly', 'pvp_win', 5, 500, 5000],
    # História
    ['Primeiro Pull', 'Faça seu primeiro pull gacha', 'story', 'pull', 1, 100, 1000],
    ['Primeira Vitória de Boss', 'Derrote seu primeiro boss', 'story', 'boss', 1, 100, 1000],
    ['Primeira Evolução', 'Evolua um personagem pela primeira vez', 'story', 'evolve', 1, 150, 1500],
]


def seed():
    """Popula o banco de dados se estiver vazio"""
    # Personagens
    count = db.get('SELECT COUNT(*) as count FROM characters')
    if count['count'] == 0:
        for c in CHARACTERS:
            db.execute(
                """INSERT INTO characters (name, anime, rarity, element, role, base_hp, base_atk, base_def, base_speed,
                   skill_name, skill_description, is_admin_exclusive, power_tier)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (c['name'], c['anime'], c['rarity'], c['element'], c['role'],
                 c['base_hp'], c['base_atk'], c['base_def'], c['base_speed'],
                 c['skill_name'], c['skill_description'], c['is_admin_exclusive'], c['power_tier'])
            )
        print(f"✅ {len(CHARACTERS)} personagens inseridos no catálogo")

    # Banners
    count = db.get('SELECT COUNT(*) as count FROM banners')
    if count['count'] == 0:
        for b in BANNERS:
            db.execute(
                'INSERT INTO banners (name, description, is_active) VALUES (?, ?, ?)',
                (b['name'], b['description'], b['is_active'])
            )
        print(f"✅ {len(BANNERS)} banners criados")

    # Associa personagens aos banners
    count = db.get('SELECT COUNT(*) as count FROM banner_items')
    if count['count'] == 0:
        def _insert_banner_items():
            for banner_name, items in [('Banner Inaugural: Heróis Lendários', BANNER1_CHARS),
                                        ('Banner: Sombras de JoJo', BANNER2_CHARS)]:
                banner = db.get('SELECT id FROM banners WHERE name = ?', (banner_name,))
                if not banner:
                    continue
                for item in items:
                    char = db.get('SELECT id FROM characters WHERE name = ?', (item['name'],))
                    if char:
                        db.execute(
                            'INSERT INTO banner_items (banner_id, character_id, drop_rate, is_rate_up) VALUES (?, ?, ?, ?)',
                            (banner['id'], char['id'], item['rate'], item['rateUp'])
                        )
        db.transaction(_insert_banner_items)
        print('✅ Itens dos banners associados')

    # Bosses
    count = db.get('SELECT COUNT(*) as count FROM bosses')
    if count['count'] == 0:
        for b in BOSSES:
            db.execute(
                'INSERT INTO bosses (name, anime, hp, atk, def, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
                (b['name'], b['anime'], b['hp'], b['atk'], b['def'], b['difficulty'])
            )
        print(f"✅ {len(BOSSES)} bosses criados")

    # Drops dos bosses
    count = db.get('SELECT COUNT(*) as count FROM boss_drops')
    if count['count'] == 0:
        def _insert_drops():
            for boss_name, drops in BOSS_DROPS.items():
                boss = db.get('SELECT id FROM bosses WHERE name = ?', (boss_name,))
                if not boss:
                    continue
                for drop in drops:
                    db.execute(
                        'INSERT INTO boss_drops (boss_id, item_name, drop_rate, quantity) VALUES (?, ?, ?, ?)',
                        (boss['id'], drop['item'], drop['rate'], drop['qty'])
                    )
        db.transaction(_insert_drops)
        print('✅ Drops dos bosses associados')

    # Evoluções
    count = db.get('SELECT COUNT(*) as count FROM character_evolutions')
    if count['count'] == 0:
        def _insert_evolutions():
            for evo in EVOLUTIONS:
                char = db.get('SELECT id FROM characters WHERE name = ?', (evo['char'],))
                if char:
                    db.execute(
                        'INSERT INTO character_evolutions (character_id, evolution_name, required_item, required_quantity, new_rarity, stat_multiplier) VALUES (?, ?, ?, ?, ?, ?)',
                        (char['id'], evo['evo'], evo['item'], evo['qty'], evo['rarity'], evo['mult'])
                    )
        db.transaction(_insert_evolutions)
        print(f"✅ {len(EVOLUTIONS)} evoluções criadas")

    # Missões
    count = db.get('SELECT COUNT(*) as count FROM missions')
    if count['count'] == 0:
        for m in MISSIONS:
            db.execute(
                'INSERT INTO missions (name, description, type, objective_type, objective_target, reward_gems, reward_gold) VALUES (?, ?, ?, ?, ?, ?, ?)',
                m
            )
        print(f"✅ {len(MISSIONS)} missões criadas")

    # Admin
    count = db.get('SELECT COUNT(*) as count FROM users')
    if count['count'] == 0:
        admin_password = 'G@ch@Adm!n2026#Frieren'
        password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt(10)).decode()

        admin_id = db.execute(
            'INSERT INTO users (username, email, password_hash, gems, gold, is_admin) VALUES (?, ?, ?, ?, ?, 1)',
            ('admin', 'admin@gacha.com', password_hash, 999999999, 999999999)
        )

        # Atribui os 3 personagens exclusivos ao admin
        exclusives = db.query('SELECT id, base_hp, base_atk, base_def, base_speed FROM characters WHERE is_admin_exclusive = 1')

        def _insert_admin_chars():
            slot = 1
            for char in exclusives:
                max_hp = char['base_hp'] * 2
                uc_id = db.execute(
                    'INSERT INTO user_characters (user_id, character_id, level, hp, max_hp, atk, def, speed) VALUES (?, ?, 100, ?, ?, ?, ?, ?)',
                    (admin_id, char['id'], max_hp, max_hp, char['base_atk'] * 2, char['base_def'] * 2, char['base_speed'] * 2)
                )
                db.execute(
                    'INSERT INTO user_teams (user_id, user_character_id, slot) VALUES (?, ?, ?)',
                    (admin_id, uc_id, slot)
                )
                slot += 1
            db.execute('INSERT INTO rankings (user_id, rating) VALUES (?, 1000)', (admin_id,))
        db.transaction(_insert_admin_chars)

        print(f"✅ Admin criado com {len(exclusives)} personagens exclusivos (Frieren, Gilgamesh, Madoka)")
        print('   Email: admin@gacha.com')
        print('   Senha: G@ch@Adm!n2026#Frieren')

    # Itens iniciais de boas-vindas
    users_without_food = db.query(
        """SELECT u.id FROM users u
           WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.user_id = u.id AND i.item_type = 'food')"""
    )

    def _insert_starter_items():
        for u in users_without_food:
            db.execute(
                "INSERT INTO inventory (user_id, item_name, item_type, quantity, rarity, stats) VALUES (?, ?, ?, ?, ?, ?)",
                (u['id'], '🍜 Miojo Ramen', 'food', 3, 'common', '{"xp": 150, "heal_percent": 25}')
            )
            db.execute(
                "INSERT INTO inventory (user_id, item_name, item_type, quantity, rarity, stats) VALUES (?, ?, ?, ?, ?, ?)",
                (u['id'], '🍖 Picanha do Anja', 'food', 1, 'rare', '{"xp": 500, "heal_percent": 40}')
            )
            db.execute(
                "INSERT INTO inventory (user_id, item_name, item_type, quantity, rarity, stats) VALUES (?, ?, ?, ?, ?, ?)",
                (u['id'], 'Poção de Cura', 'potion', 2, 'common', '{"heal": 100000}')
            )
    db.transaction(_insert_starter_items)
    if users_without_food:
        print(f"🎁 Itens iniciais dados a {len(users_without_food)} usuário(s)")


if __name__ == '__main__':
    seed()
    print('🌱 Seed concluído!')