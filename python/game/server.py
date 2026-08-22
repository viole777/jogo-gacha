"""
Servidor Flask para o Gacha Game (Python)
Replica a API Express do server/index.js
"""

import os
import json
import math
import random
import datetime
from pathlib import Path

import bcrypt
import jwt
from flask import Flask, jsonify, request, send_from_directory

from .database import db
from .seed import seed

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CLIENT_DIR = BASE_DIR / 'client'
ASSETS_DIR = BASE_DIR / 'assets'

JWT_SECRET = os.environ.get('JWT_SECRET', 'gacha-game-dev-secret-change-in-production')
JWT_EXPIRES_IN = 7 * 24 * 3600  # 7 dias em segundos

app = Flask(__name__, static_folder=str(CLIENT_DIR), static_url_path='')

# =============================================
# UTILITÁRIOS
# =============================================

def format_number(n):
    """Formata números grandes (1k, 1m, 1b, 1t, etc)"""
    if n is None:
        return '0'
    n = float(n)
    suffixes = [
        (1e18, 'sx'), (1e15, 'qd'), (1e12, 't'),
        (1e9, 'b'), (1e6, 'm'), (1e3, 'k')
    ]
    for value, suffix in suffixes:
        if abs(n) >= value:
            x = n / value
            if x >= 100:
                return f'{int(x)}{suffix}'
            return f'{x:.1f}'.rstrip('0').rstrip('.') + suffix
    return str(int(n))


def xp_to_next_level(level):
    """XP necessário para subir de nível"""
    return int(100 * (level ** 1.5))


def today_str():
    return datetime.date.today().isoformat()


def yesterday_str():
    return (datetime.date.today() - datetime.timedelta(days=1)).isoformat()


def parse_stats(stats_str):
    """Converte stats JSON string para dict"""
    if not stats_str:
        return {}
    try:
        return json.loads(stats_str)
    except (json.JSONDecodeError, TypeError):
        return {}


def add_item(user_id, item_name, item_type, quantity=1, rarity=None, stats=None):
    """Adiciona item ao inventário (ou incrementa quantidade)"""
    existing = db.get(
        'SELECT id, quantity FROM inventory WHERE user_id = ? AND item_name = ? AND item_type = ?',
        (user_id, item_name, item_type)
    )
    if existing:
        db.execute(
            'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
            (quantity, existing['id'])
        )
        return existing['id']
    return db.execute(
        'INSERT INTO inventory (user_id, item_name, item_type, quantity, rarity, stats) VALUES (?, ?, ?, ?, ?, ?)',
        (user_id, item_name, item_type, quantity, rarity, json.dumps(stats) if stats else None)
    )


def register_progress(user_id, objective_type, amount=1):
    """Registra progresso de missão"""
    missions = db.query('SELECT id FROM missions WHERE objective_type = ?', (objective_type,))
    for m in missions:
        db.execute(
            """UPDATE user_missions
               SET progress = MIN(progress + ?, (SELECT objective_target FROM missions WHERE id = mission_id))
               WHERE user_id = ? AND mission_id = ?""",
            (amount, user_id, m['id'])
        )
    db.execute(
        """UPDATE user_missions
           SET is_completed = 1
           WHERE user_id = ? AND progress >= (SELECT objective_target FROM missions WHERE id = mission_id)""",
        (user_id,)
    )


def weighted_select(items):
    """Seleção ponderada baseada no drop_rate"""
    total_rate = sum(item['drop_rate'] for item in items)
    random_value = random.random() * total_rate
    for item in items:
        random_value -= item['drop_rate']
        if random_value <= 0:
            return item
    return items[-1]


# =============================================
# AUTENTICAÇÃO
# =============================================

def authenticate():
    """Middleware de autenticação JWT"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, jsonify({'error': 'Token não fornecido'}), 401

    token = auth_header.split(' ')[1]
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user = db.get('SELECT id, username, email, is_admin FROM users WHERE id = ?', (decoded['userId'],))
        if not user:
            return None, jsonify({'error': 'Usuário não encontrado'}), 401
        return user, None, None
    except jwt.InvalidTokenError:
        return None, jsonify({'error': 'Token inválido ou expirado'}), 401


def require_auth(fn):
    """Decorator para rotas autenticadas"""
    def wrapper(*args, **kwargs):
        user, error, status = authenticate()
        if error:
            return error, status
        request.user = user
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper


# =============================================
# ROTAS DE AUTENTICAÇÃO
# =============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email e senha são obrigatórios'}), 400

    if len(username) < 3 or len(username) > 20:
        return jsonify({'error': 'Username deve ter entre 3 e 20 caracteres'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Senha deve ter pelo menos 6 caracteres'}), 400

    import re
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({'error': 'Email inválido'}), 400

    existing = db.get('SELECT id FROM users WHERE username = ? OR email = ?', (username, email))
    if existing:
        return jsonify({'error': 'Username ou email já cadastrado'}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(10)).decode()

    user_id = db.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        (username, email, password_hash)
    )

    db.execute('INSERT INTO rankings (user_id, rating) VALUES (?, 1000)', (user_id,))

    add_item(user_id, '🍜 Miojo Ramen', 'food', 3, 'common', {'xp': 150, 'heal_percent': 25})
    add_item(user_id, '🍖 Picanha do Anja', 'food', 1, 'rare', {'xp': 500, 'heal_percent': 40})
    add_item(user_id, 'Poção de Cura', 'potion', 2, 'common', {'heal': 100000})

    token = jwt.encode({'userId': user_id}, JWT_SECRET, algorithm='HS256')

    return jsonify({
        'message': 'Conta criada com sucesso!',
        'token': token,
        'user': {'id': user_id, 'username': username, 'email': email, 'gems': 1000, 'gold': 5000, 'level': 1, 'is_admin': 0}
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400

    user = db.get('SELECT * FROM users WHERE email = ?', (email,))
    if not user:
        return jsonify({'error': 'Credenciais inválidas'}), 401

    if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        return jsonify({'error': 'Credenciais inválidas'}), 401

    db.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))

    token = jwt.encode({'userId': user['id']}, JWT_SECRET, algorithm='HS256')

    return jsonify({
        'message': 'Login realizado com sucesso!',
        'token': token,
        'user': {
            'id': user['id'], 'username': user['username'], 'email': user['email'],
            'gems': user['gems'], 'gold': user['gold'], 'level': user['level'],
            'xp': user['xp'], 'is_admin': user['is_admin']
        }
    })


@app.route('/api/auth/me', methods=['GET'])
@require_auth
def me():
    user = db.get(
        'SELECT id, username, email, gems, gold, level, xp, avatar_url, is_admin, last_login, created_at FROM users WHERE id = ?',
        (request.user['id'],)
    )
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    return jsonify({'user': user})


# =============================================
# ROTAS DE CONTA
# =============================================

@app.route('/api/account', methods=['GET'])
@require_auth
def get_account():
    user = db.get(
        'SELECT id, username, email, gems, gold, level, xp, avatar_url, is_admin, last_login, created_at FROM users WHERE id = ?',
        (request.user['id'],)
    )
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404

    char_count = db.get('SELECT COUNT(*) as count FROM user_characters WHERE user_id = ?', (request.user['id'],))
    item_count = db.get('SELECT COUNT(*) as count FROM inventory WHERE user_id = ?', (request.user['id'],))
    daily = db.get('SELECT total_days, streak FROM user_daily_logins WHERE user_id = ?', (request.user['id'],)) or {'total_days': 0, 'streak': 0}

    return jsonify({
        'user': {
            **user,
            'gems_formatted': format_number(user['gems']),
            'gold_formatted': format_number(user['gold']),
            'bag_count': char_count['count'],
            'bag_limit': 20,
            'inventory_count': item_count['count'],
            'daily_streak': daily['streak'],
            'daily_total_days': daily['total_days'],
        }
    })


@app.route('/api/account/characters', methods=['GET'])
@require_auth
def get_characters():
    characters = db.query(
        """SELECT uc.id, uc.level, uc.xp, uc.hp, uc.max_hp, uc.atk, uc.def, uc.speed,
                  uc.is_favorite, uc.is_locked, uc.obtained_at,
                  c.name, c.anime, c.rarity, c.element, c.role, c.skill_name, c.skill_description,
                  c.image_url, c.image_idle_url, c.gif_attack_url, c.gif_defend_url,
                  c.gif_skill_url, c.gif_hit_url, c.gif_victory_url, c.gif_defeat_url, c.power_tier
           FROM user_characters uc
           JOIN characters c ON uc.character_id = c.id
           WHERE uc.user_id = ?
           ORDER BY uc.is_favorite DESC, uc.is_locked DESC, c.power_tier DESC""",
        (request.user['id'],)
    )

    formatted = []
    for char in characters:
        formatted.append({
            **char,
            'hp_formatted': format_number(char['hp']),
            'max_hp_formatted': format_number(char['max_hp']),
            'atk_formatted': format_number(char['atk']),
            'def_formatted': format_number(char['def']),
            'speed_formatted': format_number(char['speed']),
        })

    return jsonify({'characters': formatted, 'count': len(formatted), 'limit': 20})


@app.route('/api/account/team', methods=['GET'])
@require_auth
def get_team():
    team = db.query(
        """SELECT ut.slot, uc.id as user_character_id, uc.level, uc.xp, uc.hp, uc.max_hp, uc.atk, uc.def, uc.speed,
                  c.name, c.anime, c.rarity, c.element, c.role, c.skill_name, c.skill_description,
                  c.image_url, c.image_idle_url, c.gif_attack_url, c.gif_defend_url,
                  c.gif_skill_url, c.gif_hit_url, c.gif_victory_url, c.gif_defeat_url, c.power_tier
           FROM user_teams ut
           JOIN user_characters uc ON ut.user_character_id = uc.id
           JOIN characters c ON uc.character_id = c.id
           WHERE ut.user_id = ?
           ORDER BY ut.slot""",
        (request.user['id'],)
    )

    formatted = []
    for char in team:
        formatted.append({
            **char,
            'hp_formatted': format_number(char['hp']),
            'max_hp_formatted': format_number(char['max_hp']),
            'atk_formatted': format_number(char['atk']),
            'def_formatted': format_number(char['def']),
            'speed_formatted': format_number(char['speed']),
        })

    return jsonify({'team': formatted, 'count': len(formatted), 'limit': 3})


@app.route('/api/account/team', methods=['PUT'])
@require_auth
def set_team():
    data = request.get_json(silent=True) or {}
    slots = data.get('slots', [])

    if not slots or not isinstance(slots, list) or len(slots) == 0 or len(slots) > 3:
        return jsonify({'error': 'Envie entre 1 e 3 personagens no time'}), 400

    for char_id in slots:
        owned = db.get('SELECT id FROM user_characters WHERE id = ? AND user_id = ?', (char_id, request.user['id']))
        if not owned:
            return jsonify({'error': f'Personagem {char_id} não pertence ao jogador'}), 400

    db.execute('DELETE FROM user_teams WHERE user_id = ?', (request.user['id'],))

    def _insert_team():
        for index, char_id in enumerate(slots):
            db.execute(
                'INSERT INTO user_teams (user_id, user_character_id, slot) VALUES (?, ?, ?)',
                (request.user['id'], char_id, index + 1)
            )
    db.transaction(_insert_team)

    return jsonify({'message': 'Time atualizado com sucesso!', 'team': slots})


@app.route('/api/account/avatar', methods=['PUT'])
@require_auth
def update_avatar():
    data = request.get_json(silent=True) or {}
    avatar_url = data.get('avatar_url')
    if not avatar_url:
        return jsonify({'error': 'avatar_url é obrigatório'}), 400

    db.execute('UPDATE users SET avatar_url = ? WHERE id = ?', (avatar_url, request.user['id']))
    return jsonify({'message': 'Avatar atualizado com sucesso!', 'avatar_url': avatar_url})


@app.route('/api/account/characters/<int:char_id>/favorite', methods=['PUT'])
@require_auth
def toggle_favorite(char_id):
    char = db.get('SELECT id, is_favorite FROM user_characters WHERE id = ? AND user_id = ?', (char_id, request.user['id']))
    if not char:
        return jsonify({'error': 'Personagem não encontrado'}), 404

    new_value = 0 if char['is_favorite'] == 1 else 1
    db.execute('UPDATE user_characters SET is_favorite = ? WHERE id = ?', (new_value, char_id))
    return jsonify({
        'message': 'Personagem favoritado!' if new_value == 1 else 'Personagem desfavoritado',
        'is_favorite': new_value
    })


@app.route('/api/account/characters/<int:char_id>/lock', methods=['PUT'])
@require_auth
def toggle_lock(char_id):
    char = db.get('SELECT id, is_locked FROM user_characters WHERE id = ? AND user_id = ?', (char_id, request.user['id']))
    if not char:
        return jsonify({'error': 'Personagem não encontrado'}), 404

    new_value = 0 if char['is_locked'] == 1 else 1
    db.execute('UPDATE user_characters SET is_locked = ? WHERE id = ?', (new_value, char_id))
    return jsonify({
        'message': 'Personagem bloqueado!' if new_value == 1 else 'Personagem desbloqueado',
        'is_locked': new_value
    })


@app.route('/api/account/characters/<int:char_id>', methods=['DELETE'])
@require_auth
def delete_character(char_id):
    char = db.get(
        """SELECT uc.id, uc.is_favorite, uc.is_locked, c.is_admin_exclusive, c.name, c.rarity
           FROM user_characters uc
           JOIN characters c ON uc.character_id = c.id
           WHERE uc.id = ? AND uc.user_id = ?""",
        (char_id, request.user['id'])
    )
    if not char:
        return jsonify({'error': 'Personagem não encontrado'}), 404

    if char['is_admin_exclusive'] == 1:
        return jsonify({'error': 'Não é possível deletar personagens exclusivos do admin'}), 400
    if char['is_favorite'] == 1:
        return jsonify({'error': 'Desfavorite o personagem antes de deletar'}), 400
    if char['is_locked'] == 1:
        return jsonify({'error': 'Desbloqueie o personagem antes de deletar'}), 400

    db.execute('DELETE FROM user_teams WHERE user_character_id = ?', (char_id,))
    db.execute('DELETE FROM user_characters WHERE id = ?', (char_id,))

    return jsonify({'message': f'{char["name"]} deletado com sucesso!', 'character': char['name'], 'rarity': char['rarity']})


# =============================================
# ROTAS DE INVENTÁRIO
# =============================================

@app.route('/api/inventory', methods=['GET'])
@require_auth
def get_inventory():
    items = db.query(
        'SELECT id, item_name, item_type, quantity, rarity, stats, created_at FROM inventory WHERE user_id = ? ORDER BY item_type, item_name',
        (request.user['id'],)
    )
    formatted = [{**item, 'stats': parse_stats(item['stats'])} for item in items]
    return jsonify({'items': formatted, 'count': len(formatted)})


@app.route('/api/inventory/use', methods=['POST'])
@require_auth
def use_item():
    data = request.get_json(silent=True) or {}
    item_id = data.get('item_id')
    quantity = data.get('quantity', 1)
    user_character_id = data.get('user_character_id')

    if not item_id:
        return jsonify({'error': 'item_id é obrigatório'}), 400

    item = db.get('SELECT * FROM inventory WHERE id = ? AND user_id = ?', (item_id, request.user['id']))
    if not item:
        return jsonify({'error': 'Item não encontrado'}), 404

    if item['quantity'] < quantity:
        return jsonify({'error': 'Quantidade insuficiente'}), 400

    stats = parse_stats(item['stats'])
    result = None

    if item['item_type'] == 'potion':
        if not user_character_id:
            return jsonify({'error': 'Informe user_character_id para usar a poção'}), 400

        target = db.get('SELECT id, hp, max_hp FROM user_characters WHERE id = ? AND user_id = ?', (user_character_id, request.user['id']))
        if not target:
            return jsonify({'error': 'Personagem não encontrado'}), 404

        heal_amount = stats.get('heal', 0)
        if stats.get('heal_percent'):
            heal_amount = int((target['max_hp'] or target['hp']) * (stats['heal_percent'] / 100))

        new_hp = min(target['max_hp'] or target['hp'], target['hp'] + heal_amount)
        actual_heal = new_hp - target['hp']

        if actual_heal <= 0:
            return jsonify({'error': 'Personagem já está com HP cheio'}), 400

        db.execute('UPDATE user_characters SET hp = ? WHERE id = ?', (new_hp, target['id']))
        result = {'message': f'Poção usada! +{actual_heal} HP em {item["item_name"]}', 'healed': actual_heal, 'user_character_id': target['id']}

    elif item['item_type'] == 'food':
        if not user_character_id:
            return jsonify({'error': 'Informe user_character_id para alimentar o personagem'}), 400

        target = db.get(
            """SELECT uc.id, uc.level, uc.xp, uc.hp, uc.max_hp, c.name
               FROM user_characters uc
               JOIN characters c ON uc.character_id = c.id
               WHERE uc.id = ? AND uc.user_id = ?""",
            (user_character_id, request.user['id'])
        )
        if not target:
            return jsonify({'error': 'Personagem não encontrado'}), 404

        xp_gain = stats.get('xp', 50)
        levels_gained = 0
        new_level = target['level']
        new_xp = target['xp'] + xp_gain

        while new_xp >= xp_to_next_level(new_level):
            new_xp -= xp_to_next_level(new_level)
            new_level += 1
            levels_gained += 1

        restored_hp = 0
        if target['max_hp'] and target['hp'] < target['max_hp']:
            food_heal_percent = stats.get('heal_percent', 30)
            restored_hp = int(target['max_hp'] * (food_heal_percent / 100))
            restored_hp = min(restored_hp, target['max_hp'] - target['hp'])

        stat_mult = 1.1 ** levels_gained
        hp = int(target['max_hp'] * stat_mult) if target['max_hp'] else target['hp']
        new_hp = target['hp'] * stat_mult + restored_hp if hp else target['hp']

        db.execute(
            'UPDATE user_characters SET level = ?, xp = ?, max_hp = ?, hp = ? WHERE id = ?',
            (new_level, new_xp, hp, min(hp, int(new_hp)), target['id'])
        )

        register_progress(request.user['id'], 'feed', quantity)

        result = {
            'message': f'{target["name"]} comeu {item["item_name"]}! +{xp_gain} XP' + (f', subiu {levels_gained} nível(is)!' if levels_gained > 0 else ''),
            'character': target['name'], 'xp_gained': xp_gain, 'levels_gained': levels_gained,
            'new_level': new_level, 'hp_restored': restored_hp
        }

    elif item['item_type'] == 'ticket':
        gems_amount = stats.get('gems', 100)
        db.execute('UPDATE users SET gems = gems + ? WHERE id = ?', (gems_amount, request.user['id']))
        result = {'message': f'Ticket usado! +{gems_amount} gems', 'gems_added': gems_amount}

    elif item['item_type'] == 'material':
        return jsonify({'error': 'Materiais são usados na evolução de personagens'}), 400

    elif item['item_type'] == 'equipment':
        return jsonify({'error': 'Equipamentos são equipados automaticamente'}), 400

    else:
        return jsonify({'error': 'Tipo de item não suportado'}), 400

    # Atualiza quantidade ou remove
    if item['quantity'] <= quantity:
        db.execute('DELETE FROM inventory WHERE id = ?', (item['id'],))
    else:
        db.execute('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', (quantity, item['id']))

    return jsonify({**result, 'item_remaining': item['quantity'] - quantity})


# =============================================
# ROTAS DE GACHA/BANNERS
# =============================================

PULL_COST = 100
MULTI_PULL_COST = 1000


@app.route('/api/banners', methods=['GET'])
def get_banners():
    banners = db.query(
        'SELECT id, name, description, image_url, start_date, end_date, is_active, created_at FROM banners WHERE is_active = 1 ORDER BY created_at DESC'
    )
    return jsonify({'banners': banners})


@app.route('/api/banners/<int:banner_id>', methods=['GET'])
def get_banner_details(banner_id):
    banner = db.get('SELECT * FROM banners WHERE id = ? AND is_active = 1', (banner_id,))
    if not banner:
        return jsonify({'error': 'Banner não encontrado'}), 404

    items = db.query(
        """SELECT bi.id, bi.drop_rate, bi.is_rate_up,
                  c.id as character_id, c.name, c.anime, c.rarity, c.element, c.role,
                  c.skill_name, c.skill_description, c.image_url, c.power_tier
           FROM banner_items bi
           JOIN characters c ON bi.character_id = c.id
           WHERE bi.banner_id = ?
           ORDER BY c.power_tier DESC""",
        (banner_id,)
    )

    by_rarity = {}
    for item in items:
        if item['rarity'] not in by_rarity:
            by_rarity[item['rarity']] = {'characters': [], 'total_rate': 0}
        by_rarity[item['rarity']]['characters'].append(item)
        by_rarity[item['rarity']]['total_rate'] += item['drop_rate']

    return jsonify({'banner': banner, 'pull_cost': PULL_COST, 'multi_pull_cost': MULTI_PULL_COST, 'items': items, 'by_rarity': by_rarity})


@app.route('/api/banners/<int:banner_id>/pull', methods=['POST'])
@require_auth
def pull(banner_id):
    data = request.get_json(silent=True) or {}
    quantity = data.get('quantity', 1)

    if quantity not in (1, 10):
        return jsonify({'error': 'Quantidade deve ser 1 ou 10'}), 400

    banner = db.get('SELECT * FROM banners WHERE id = ? AND is_active = 1', (banner_id,))
    if not banner:
        return jsonify({'error': 'Banner não encontrado'}), 404

    cost = MULTI_PULL_COST if quantity == 10 else PULL_COST

    user = db.get('SELECT gems FROM users WHERE id = ?', (request.user['id'],))
    if user['gems'] < cost:
        return jsonify({'error': 'Gems insuficientes', 'required': cost, 'current': user['gems']}), 400

    bag_count = db.get('SELECT COUNT(*) as count FROM user_characters WHERE user_id = ?', (request.user['id'],))
    if bag_count['count'] + quantity > 20:
        return jsonify({'error': 'Bag cheia! Libere espaço antes de puxar.', 'bag_count': bag_count['count'], 'bag_limit': 20}), 400

    banner_items = db.query(
        """SELECT bi.character_id, bi.drop_rate, bi.is_rate_up,
                  c.name, c.anime, c.rarity, c.base_hp, c.base_atk, c.base_def, c.base_speed,
                  c.skill_name, c.skill_description, c.image_url, c.image_idle_url,
                  c.gif_attack_url, c.gif_defend_url, c.gif_skill_url, c.gif_hit_url,
                  c.gif_victory_url, c.gif_defeat_url, c.power_tier
           FROM banner_items bi
           JOIN characters c ON bi.character_id = c.id
           WHERE bi.banner_id = ?""",
        (banner_id,)
    )

    if not banner_items:
        return jsonify({'error': 'Banner sem personagens'}), 400

    results = []

    def _do_pull():
        db.execute('UPDATE users SET gems = gems - ? WHERE id = ?', (cost, request.user['id']))
        for _ in range(quantity):
            pulled = weighted_select(banner_items)
            uc_id = db.execute(
                'INSERT INTO user_characters (user_id, character_id, level, hp, max_hp, atk, def, speed) VALUES (?, ?, 1, ?, ?, ?, ?, ?)',
                (request.user['id'], pulled['character_id'], pulled['base_hp'], pulled['base_hp'],
                 pulled['base_atk'], pulled['base_def'], pulled['base_speed'])
            )
            results.append({
                'user_character_id': uc_id,
                'name': pulled['name'], 'anime': pulled['anime'], 'rarity': pulled['rarity'],
                'skill_name': pulled['skill_name'], 'skill_description': pulled['skill_description'],
                'image_url': pulled['image_url'], 'image_idle_url': pulled['image_idle_url'],
                'gif_attack_url': pulled['gif_attack_url'], 'gif_defend_url': pulled['gif_defend_url'],
                'gif_skill_url': pulled['gif_skill_url'], 'gif_hit_url': pulled['gif_hit_url'],
                'gif_victory_url': pulled['gif_victory_url'], 'gif_defeat_url': pulled['gif_defeat_url'],
                'power_tier': pulled['power_tier'],
                'hp': pulled['base_hp'], 'atk': pulled['base_atk'], 'def': pulled['base_def'], 'speed': pulled['base_speed'],
                'hp_formatted': format_number(pulled['base_hp']),
                'atk_formatted': format_number(pulled['base_atk']),
                'def_formatted': format_number(pulled['base_def']),
                'speed_formatted': format_number(pulled['base_speed']),
                'is_rate_up': pulled['is_rate_up'],
            })
    db.transaction(_do_pull)

    register_progress(request.user['id'], 'pull', quantity)

    updated_user = db.get('SELECT gems FROM users WHERE id = ?', (request.user['id'],))

    rarity_order = {'secret': 0, 'mythic': 1, 'legendary': 2, 'epic': 3, 'rare': 4, 'common': 5}
    results.sort(key=lambda x: rarity_order.get(x['rarity'], 5))

    return jsonify({
        'message': 'Multi-pull realizado!' if quantity == 10 else 'Pull realizado!',
        'banner': {'id': banner['id'], 'name': banner['name']},
        'cost': cost, 'gems_remaining': updated_user['gems'], 'results': results
    })


# =============================================
# ROTAS DE LOJA
# =============================================

SHOP_ITEMS = [
    {'id': 'luck_potion', 'name': 'Poção de Sorte', 'description': 'Aumenta as chances de conseguir personagens raros no gacha por 30 minutos.', 'price_gems': 50, 'price_gold': None, 'rarity': 'epic'},
    {'id': 'luck_scroll', 'name': 'Scroll da Sorte', 'description': 'Garante 1 personagem épico ou superior no próximo pull.', 'price_gems': 200, 'price_gold': None, 'rarity': 'legendary'},
    {'id': 'gacha_ticket', 'name': 'Ticket de Gacha', 'description': 'Permite 1 pull grátis em qualquer banner.', 'price_gems': 100, 'price_gold': None, 'rarity': 'rare'},
    {'id': 'heal_potion', 'name': 'Poção de Cura', 'description': 'Restaura a vida de um personagem do time.', 'price_gems': None, 'price_gold': 500, 'rarity': 'common'},
    {'id': 'picanha_anja', 'name': '🍖 Picanha do Anja', 'description': 'Alimento raro que dá 500 XP ao personagem e restaura 40% do HP.', 'price_gems': None, 'price_gold': 1500, 'rarity': 'rare'},
    {'id': 'miojo_ramen', 'name': '🍜 Miojo Ramen', 'description': 'Alimento comum que dá 150 XP ao personagem e restaura 25% do HP.', 'price_gems': None, 'price_gold': 300, 'rarity': 'common'},
    {'id': 'bom_hamburguer', 'name': '🍔 Bom Hamburguer', 'description': 'Alimento que dá 300 XP ao personagem e restaura 30% do HP.', 'price_gems': None, 'price_gold': 800, 'rarity': 'rare'},
    {'id': 'churros', 'name': '🥖 Churros de Doce de Leite', 'description': 'Alimento que dá 250 XP ao personagem e restaura 20% do HP.', 'price_gems': None, 'price_gold': 600, 'rarity': 'common'},
    {'id': 'empadao', 'name': '🥧 Empadão da Vó', 'description': 'Alimento delicioso que dá 400 XP e restaura 35% do HP.', 'price_gems': None, 'price_gold': 1000, 'rarity': 'rare'},
]

SELL_PRICES_GOLD = {'common': 100, 'rare': 500, 'epic': 2000, 'legendary': 10000, 'mythic': 50000, 'secret': 250000}
SELL_PRICES_GEMS = {'legendary': 20, 'mythic': 50, 'secret': 100}

FOOD_STATS = {
    'picanha_anja': {'xp': 500, 'heal_percent': 40},
    'miojo_ramen': {'xp': 150, 'heal_percent': 25},
    'bom_hamburguer': {'xp': 300, 'heal_percent': 30},
    'churros': {'xp': 250, 'heal_percent': 20},
    'empadao': {'xp': 400, 'heal_percent': 35},
}


@app.route('/api/shop', methods=['GET'])
@require_auth
def get_shop():
    return jsonify({'items': SHOP_ITEMS, 'sell_prices_gold': SELL_PRICES_GOLD, 'sell_prices_gems': SELL_PRICES_GEMS})


@app.route('/api/shop/buy', methods=['POST'])
@require_auth
def buy_item():
    data = request.get_json(silent=True) or {}
    item_id = data.get('item_id')
    quantity = data.get('quantity', 1)

    if not item_id:
        return jsonify({'error': 'item_id é obrigatório'}), 400

    shop_item = next((item for item in SHOP_ITEMS if item['id'] == item_id), None)
    if not shop_item:
        return jsonify({'error': 'Item não encontrado na loja'}), 404

    user = db.get('SELECT gems, gold FROM users WHERE id = ?', (request.user['id'],))

    if shop_item['price_gems'] is not None:
        total_cost = shop_item['price_gems'] * quantity
        currency = 'gems'
        if user['gems'] < total_cost:
            return jsonify({'error': 'Gems insuficientes', 'required': total_cost, 'current': user['gems']}), 400
    elif shop_item['price_gold'] is not None:
        total_cost = shop_item['price_gold'] * quantity
        currency = 'gold'
        if user['gold'] < total_cost:
            return jsonify({'error': 'Gold insuficiente', 'required': total_cost, 'current': user['gold']}), 400
    else:
        return jsonify({'error': 'Item sem preço definido'}), 400

    if currency == 'gems':
        db.execute('UPDATE users SET gems = gems - ? WHERE id = ?', (total_cost, request.user['id']))
    else:
        db.execute('UPDATE users SET gold = gold - ? WHERE id = ?', (total_cost, request.user['id']))

    item_type = 'material'
    if item_id == 'heal_potion':
        item_type = 'potion'
    if item_id == 'gacha_ticket':
        item_type = 'ticket'
    if item_id in FOOD_STATS:
        item_type = 'food'

    stats = {}
    if item_id == 'luck_potion':
        stats['luck_boost'] = 1.5
    if item_id == 'luck_scroll':
        stats['guaranteed_epic'] = True
    if item_id == 'gacha_ticket':
        stats['gems'] = 100
    if item_id == 'heal_potion':
        stats['heal'] = 100000
    if item_id in FOOD_STATS:
        stats.update(FOOD_STATS[item_id])

    add_item(request.user['id'], shop_item['name'], item_type, quantity, shop_item['rarity'], stats)

    updated_user = db.get('SELECT gems, gold FROM users WHERE id = ?', (request.user['id'],))

    return jsonify({
        'message': f'{shop_item["name"]} comprado com sucesso!',
        'item': shop_item['name'], 'quantity': quantity, 'cost': total_cost, 'currency': currency,
        'gems_remaining': updated_user['gems'], 'gold_remaining': updated_user['gold']
    })


@app.route('/api/shop/sell', methods=['POST'])
@require_auth
def sell_character():
    data = request.get_json(silent=True) or {}
    user_character_id = data.get('user_character_id')

    if not user_character_id:
        return jsonify({'error': 'user_character_id é obrigatório'}), 400

    char = db.get(
        """SELECT uc.id, uc.user_id, c.name, c.rarity, c.is_admin_exclusive
           FROM user_characters uc
           JOIN characters c ON uc.character_id = c.id
           WHERE uc.id = ? AND uc.user_id = ?""",
        (user_character_id, request.user['id'])
    )
    if not char:
        return jsonify({'error': 'Personagem não encontrado'}), 404

    if char['is_admin_exclusive'] == 1:
        return jsonify({'error': 'Não é possível vender personagens exclusivos do admin'}), 400

    gold_reward = SELL_PRICES_GOLD.get(char['rarity'], 0)
    gems_reward = SELL_PRICES_GEMS.get(char['rarity'], 0)
    is_premium_sell = char['rarity'] in ('legendary', 'mythic', 'secret')

    db.execute('DELETE FROM user_characters WHERE id = ?', (user_character_id,))
    db.execute('DELETE FROM user_teams WHERE user_character_id = ?', (user_character_id,))

    if is_premium_sell and gems_reward > 0:
        db.execute('UPDATE users SET gems = gems + ? WHERE id = ?', (gems_reward, request.user['id']))
    else:
        db.execute('UPDATE users SET gold = gold + ? WHERE id = ?', (gold_reward, request.user['id']))

    updated_user = db.get('SELECT gems, gold FROM users WHERE id = ?', (request.user['id'],))

    return jsonify({
        'message': f'{char["name"]} vendido com sucesso!',
        'character': char['name'], 'rarity': char['rarity'],
        'gold_reward': 0 if is_premium_sell else gold_reward,
        'gems_reward': gems_reward if is_premium_sell else 0,
        'gems_remaining': updated_user['gems'], 'gold_remaining': updated_user['gold']
    })


# =============================================
# ROTAS DE EVOLUÇÃO
# =============================================

@app.route('/api/evolution/character/<int:user_char_id>', methods=['GET'])
@require_auth
def get_character_evolutions(user_char_id):
    char = db.get(
        """SELECT uc.id, uc.level, uc.xp, uc.max_hp, uc.hp, uc.atk, uc.def, uc.speed,
                  c.id as character_id, c.name, c.rarity, c.element, c.role, c.anime
           FROM user_characters uc
           JOIN characters c ON uc.character_id = c.id
           WHERE uc.id = ? AND uc.user_id = ?""",
        (user_char_id, request.user['id'])
    )
    if not char:
        return jsonify({'error': 'Personagem não encontrado'}), 404

    evolutions = db.query(
        """SELECT ce.id, ce.evolution_name, ce.required_item, ce.required_quantity, ce.new_rarity, ce.stat_multiplier
           FROM character_evolutions ce
           WHERE ce.character_id = ?
           ORDER BY ce.id""",
        (char['character_id'],)
    )

    inventory = db.query('SELECT item_name, quantity FROM inventory WHERE user_id = ?', (request.user['id'],))

    evo_list = []
    for evo in evolutions:
        item = next((i for i in inventory if i['item_name'] == evo['required_item']), None)
        has_item = item and item['quantity'] >= evo['required_quantity']
        evo_list.append({
            **evo,
            'has_item': bool(has_item),
            'owned_quantity': item['quantity'] if item else 0,
        })

    return jsonify({
        'character': {
            'id': char['id'], 'name': char['name'], 'rarity': char['rarity'],
            'element': char['element'], 'role': char['role'], 'level': char['level'],
            'hp_formatted': format_number(char['max_hp'] or char['hp']),
            'atk_formatted': format_number(char['atk']),
            'def_formatted': format_number(char['def']),
        },
        'evolutions': evo_list
    })


@app.route('/api/evolution/evolve', methods=['POST'])
@require_auth
def evolve_character():
    data = request.get_json(silent=True) or {}
    user_character_id = data.get('user_character_id')
    evolution_id = data.get('evolution_id')

    if not user_character_id or not evolution_id:
        return jsonify({'error': 'user_character_id e evolution_id são obrigatórios'}), 400

    evolution = db.get(
        """SELECT ce.*, c.name as char_name, c.rarity as current_rarity
           FROM character_evolutions ce
           JOIN characters c ON ce.character_id = c.id
           WHERE ce.id = ?""",
        (evolution_id,)
    )
    if not evolution:
        return jsonify({'error': 'Evolução não encontrada'}), 404

    char = db.get(
        """SELECT uc.*, c.name, c.anime, c.rarity, c.element, c.role, c.skill_name, c.skill_description,
                  c.base_hp, c.base_atk, c.base_def, c.base_speed
           FROM user_characters uc
           JOIN characters c ON uc.character_id = c.id
           WHERE uc.id = ? AND uc.user_id = ?""",
        (user_character_id, request.user['id'])
    )
    if not char:
        return jsonify({'error': 'Personagem não encontrado'}), 404

    if char['character_id'] != evolution['character_id']:
        return jsonify({'error': 'Evolução não pertence a este personagem'}), 400

    item = db.get('SELECT id, quantity FROM inventory WHERE user_id = ? AND item_name = ?', (request.user['id'], evolution['required_item']))
    has_item = item and item['quantity'] >= evolution['required_quantity']
    if not has_item:
        return jsonify({
            'error': f'Requer {evolution["required_quantity"]}x {evolution["required_item"]}',
            'required_item': evolution['required_item'],
            'required_quantity': evolution['required_quantity'],
            'owned': item['quantity'] if item else 0
        }), 400

    if item['quantity'] == evolution['required_quantity']:
        db.execute('DELETE FROM inventory WHERE id = ?', (item['id'],))
    else:
        db.execute('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', (evolution['required_quantity'], item['id']))

    mult = evolution['stat_multiplier']
    new_max_hp = int((char['max_hp'] or char['hp']) * mult)
    new_hp = new_max_hp
    new_atk = int((char['atk'] or char['base_atk']) * mult)
    new_def = int((char['def'] or char['base_def']) * mult)
    new_speed = int((char['speed'] or char['base_speed']) * mult)

    db.execute(
        'UPDATE user_characters SET max_hp = ?, hp = ?, atk = ?, def = ?, speed = ? WHERE id = ?',
        (new_max_hp, new_hp, new_atk, new_def, new_speed, user_character_id)
    )

    register_progress(request.user['id'], 'evolve')

    return jsonify({
        'message': f'{char["name"]} evoluiu para {evolution["evolution_name"]}!',
        'evolution': {'name': evolution['evolution_name'], 'new_rarity': evolution['new_rarity'], 'stat_multiplier': mult},
        'character': {
            'id': char['id'], 'name': char['name'], 'rarity': evolution['new_rarity'],
            'hp_formatted': format_number(new_max_hp), 'atk_formatted': format_number(new_atk),
            'def_formatted': format_number(new_def), 'speed_formatted': format_number(new_speed)
        }
    })


# =============================================
# ROTAS DE MISSÕES
# =============================================

DAILY_REWARDS = [
    {'day': 1, 'gems': 50, 'gold': 500},
    {'day': 2, 'gems': 75, 'gold': 750},
    {'day': 3, 'gems': 100, 'gold': 1000},
    {'day': 4, 'gems': 150, 'gold': 1500},
    {'day': 5, 'gems': 200, 'gold': 2000},
    {'day': 6, 'gems': 250, 'gold': 2500},
    {'day': 7, 'gems': 500, 'gold': 5000},
]


@app.route('/api/missions/daily-login', methods=['GET'])
@require_auth
def get_daily_login():
    row = db.get('SELECT * FROM user_daily_logins WHERE user_id = ?', (request.user['id'],))
    if not row:
        db.execute('INSERT INTO user_daily_logins (user_id) VALUES (?)', (request.user['id'],))
        row = db.get('SELECT * FROM user_daily_logins WHERE user_id = ?', (request.user['id'],))

    today = today_str()
    can_claim = row['last_claim'] != today
    streak = row['streak']
    if can_claim and row['last_claim'] != yesterday_str():
        streak = 0

    next_day = (streak % 7) + 1
    reward = next((r for r in DAILY_REWARDS if r['day'] == next_day), DAILY_REWARDS[0])

    return jsonify({
        'can_claim': can_claim, 'streak': streak, 'total_days': row['total_days'],
        'next_day': next_day, 'next_reward': reward, 'rewards': DAILY_REWARDS, 'last_claim': row['last_claim']
    })


@app.route('/api/missions/daily-login/claim', methods=['POST'])
@require_auth
def claim_daily_login():
    row = db.get('SELECT * FROM user_daily_logins WHERE user_id = ?', (request.user['id'],))
    if not row:
        db.execute('INSERT INTO user_daily_logins (user_id) VALUES (?)', (request.user['id'],))
        row = db.get('SELECT * FROM user_daily_logins WHERE user_id = ?', (request.user['id'],))

    today = today_str()
    if row['last_claim'] == today:
        return jsonify({'error': 'Você já reivindicou a recompensa hoje!'}), 400

    streak = row['streak']
    if row['last_claim'] != yesterday_str():
        streak = 0
    streak += 1

    day = ((streak - 1) % 7) + 1
    reward = next((r for r in DAILY_REWARDS if r['day'] == day), DAILY_REWARDS[0])

    db.execute('UPDATE users SET gems = gems + ?, gold = gold + ? WHERE id = ?', (reward['gems'], reward['gold'], request.user['id']))
    db.execute(
        'UPDATE user_daily_logins SET last_claim = ?, streak = ?, total_days = total_days + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        (today, streak, request.user['id'])
    )

    return jsonify({
        'message': f'Recompensa do dia {day} reivindicada! +{reward["gems"]} gems, +{reward["gold"]} gold',
        'day': day, 'streak': streak, 'reward': reward
    })


@app.route('/api/missions', methods=['GET'])
@require_auth
def get_missions():
    missions = db.query('SELECT * FROM missions')
    for m in missions:
        db.execute('INSERT OR IGNORE INTO user_missions (user_id, mission_id) VALUES (?, ?)', (request.user['id'], m['id']))

    user_missions = db.query(
        """SELECT m.id, m.name, m.description, m.type, m.objective_type, m.objective_target,
                  m.reward_gems, m.reward_gold,
                  um.progress, um.is_completed, um.claimed_at
           FROM missions m
           JOIN user_missions um ON m.id = um.mission_id
           WHERE um.user_id = ?
           ORDER BY m.type, m.id""",
        (request.user['id'],)
    )

    grouped = {
        'daily': [m for m in user_missions if m['type'] == 'daily'],
        'weekly': [m for m in user_missions if m['type'] == 'weekly'],
        'story': [m for m in user_missions if m['type'] == 'story'],
    }

    return jsonify({'missions': user_missions, 'grouped': grouped})


@app.route('/api/missions/<int:mission_id>/claim', methods=['POST'])
@require_auth
def claim_mission(mission_id):
    row = db.get(
        """SELECT m.id, m.name, m.reward_gems, m.reward_gold,
                  um.progress, um.is_completed, um.claimed_at
           FROM missions m
           JOIN user_missions um ON m.id = um.mission_id
           WHERE m.id = ? AND um.user_id = ?""",
        (mission_id, request.user['id'])
    )
    if not row:
        return jsonify({'error': 'Missão não encontrada'}), 404
    if not row['is_completed']:
        return jsonify({'error': 'Missão ainda não completada'}), 400
    if row['claimed_at']:
        return jsonify({'error': 'Recompensa já reivindicada'}), 400

    db.execute('UPDATE users SET gems = gems + ?, gold = gold + ? WHERE id = ?', (row['reward_gems'], row['reward_gold'], request.user['id']))
    db.execute('UPDATE user_missions SET claimed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND mission_id = ?', (request.user['id'], mission_id))

    return jsonify({
        'message': f'Missão "{row["name"]}" completada! +{row["reward_gems"]} gems, +{row["reward_gold"]} gold',
        'reward_gems': row['reward_gems'], 'reward_gold': row['reward_gold']
    })


# =============================================
# ROTAS DE BOSSES
# =============================================

@app.route('/api/bosses', methods=['GET'])
@require_auth
def get_bosses():
    bosses = db.query(
        """SELECT b.id, b.name, b.anime, b.hp, b.atk, b.def, b.difficulty, b.image_url,
                  b.gif_attack_url, b.gif_defend_url, b.gif_skill_url,
                  (SELECT GROUP_CONCAT(item_name || '|' || drop_rate || '|' || quantity, ';')
                   FROM boss_drops WHERE boss_drops.boss_id = b.id) as drops_raw
           FROM bosses b
           ORDER BY b.difficulty, b.anime"""
    )

    formatted = []
    for boss in bosses:
        drops = []
        if boss['drops_raw']:
            for d in boss['drops_raw'].split(';'):
                if not d:
                    continue
                parts = d.split('|')
                if len(parts) == 3:
                    drops.append({'item_name': parts[0], 'drop_rate': float(parts[1]), 'quantity': int(parts[2])})
        formatted.append({
            **boss,
            'drops': drops,
            'hp_formatted': format_number(boss['hp']),
            'atk_formatted': format_number(boss['atk']),
            'def_formatted': format_number(boss['def']),
        })

    return jsonify({'bosses': formatted})


@app.route('/api/bosses/<int:boss_id>/fight', methods=['POST'])
@require_auth
def fight_boss(boss_id):
    data = request.get_json(silent=True) or {}
    team = data.get('team', [])

    if not isinstance(team, list) or len(team) == 0 or len(team) > 3:
        return jsonify({'error': 'Envie um time de 1 a 3 personagens'}), 400

    boss = db.get('SELECT * FROM bosses WHERE id = ?', (boss_id,))
    if not boss:
        return jsonify({'error': 'Boss não encontrado'}), 404

    placeholders = ','.join(['?'] * len(team))
    team_chars = db.query(
        f"""SELECT uc.id, uc.level, uc.hp, uc.max_hp, uc.atk, uc.def, uc.speed,
                  c.name, c.rarity, c.element, c.role, c.skill_name, c.skill_description,
                  c.image_url, c.image_idle_url, c.gif_attack_url, c.gif_defend_url,
                  c.gif_hit_url, c.gif_victory_url, c.gif_defeat_url
           FROM user_characters uc
           JOIN characters c ON uc.character_id = c.id
           WHERE uc.id IN ({placeholders}) AND uc.user_id = ?""",
        (*team, request.user['id'])
    )

    if not team_chars:
        return jsonify({'error': 'Time inválido'}), 400

    # Simula a batalha
    boss_hp = boss['hp']
    boss_def = boss['def']
    boss_atk = boss['atk']
    log = []
    events = []
    player_survived = True

    max_turns = 30
    for turn in range(1, max_turns + 1):
        if boss_hp <= 0:
            break

        # Ataque do time
        for char in team_chars:
            if boss_hp <= 0:
                break
            if char['hp'] <= 0:
                continue

            damage = max(1, int(char['atk'] - boss_def * 0.3))
            boss_hp -= damage
            log.append(f'Turno {turn}: {char["name"]} causa {format_number(damage)} de dano no boss.')
            events.append({
                'type': 'player_attack', 'turn': turn,
                'attacker': char['name'], 'attacker_id': char['id'],
                'target': boss['name'], 'damage': damage,
                'damage_formatted': format_number(damage),
                'boss_hp': max(0, int(boss_hp)),
                'boss_hp_formatted': format_number(max(0, boss_hp)),
                'char_hp': max(0, int(char['hp'])),
            })

        if boss_hp <= 0:
            break

        # Ataque do boss
        for char in team_chars:
            if char['hp'] <= 0:
                continue
            damage = max(1, int(boss_atk - char['def'] * 0.5))
            char['hp'] -= damage
            log.append(f'Turno {turn}: {boss["name"]} causa {format_number(damage)} de dano em {char["name"]}.')
            events.append({
                'type': 'boss_attack', 'turn': turn,
                'attacker': boss['name'], 'target': char['name'], 'target_id': char['id'],
                'damage': damage, 'damage_formatted': format_number(damage),
                'boss_hp': max(0, int(boss_hp)),
                'char_hp': max(0, int(char['hp'])),
            })
            if char['hp'] <= 0:
                log.append(f'{char["name"]} foi derrotado!')
                events.append({
                    'type': 'player_defeated', 'turn': turn,
                    'target': char['name'], 'target_id': char['id'], 'char_hp': 0
                })

        if all(c['hp'] <= 0 for c in team_chars):
            player_survived = False
            break

    victory = player_survived and boss_hp <= 0

    # Persiste HP
    for char in team_chars:
        db.execute('UPDATE user_characters SET hp = ? WHERE id = ? AND user_id = ?', (max(0, int(char['hp'])), char['id'], request.user['id']))

    # Drops
    drops = []
    if victory:
        boss_drops = db.query('SELECT item_name, drop_rate, quantity FROM boss_drops WHERE boss_id = ?', (boss_id,))
        for drop in boss_drops:
            if random.random() < drop['drop_rate']:
                add_item(request.user['id'], drop['item_name'], 'material', drop['quantity'], 'epic', {'evolution_material': True})
                drops.append({'item_name': drop['item_name'], 'quantity': drop['quantity']})

        gold_reward = {'easy': 500, 'normal': 1500, 'hard': 3000, 'nightmare': 8000}.get(boss['difficulty'], 1000)
        db.execute('UPDATE users SET gold = gold + ? WHERE id = ?', (gold_reward, request.user['id']))
        register_progress(request.user['id'], 'boss')

    return jsonify({
        'victory': victory,
        'boss': {
            'id': boss['id'], 'name': boss['name'], 'anime': boss['anime'],
            'difficulty': boss['difficulty'], 'image_url': boss['image_url'],
            'gif_attack_url': boss['gif_attack_url'], 'gif_defend_url': boss['gif_defend_url'],
            'gif_skill_url': boss['gif_skill_url'], 'hp': boss['hp'], 'atk': boss['atk'], 'def': boss['def'],
        },
        'boss_hp_remaining': max(0, int(boss_hp)),
        'boss_hp_formatted': format_number(max(0, boss_hp)),
        'log': log, 'events': events, 'drops': drops,
        'drops_formatted': [f'{d["item_name"]} x{d["quantity"]}' for d in drops],
        'team_status': [
            {
                'id': c['id'], 'name': c['name'], 'hp': max(0, int(c['hp'])),
                'hp_formatted': format_number(max(0, c['hp'])), 'max_hp': c['max_hp'],
                'image_url': c['image_url'], 'image_idle_url': c['image_idle_url'],
                'gif_attack_url': c['gif_attack_url'], 'gif_defend_url': c['gif_defend_url'],
                'gif_hit_url': c['gif_hit_url'], 'gif_victory_url': c['gif_victory_url'],
                'gif_defeat_url': c['gif_defeat_url'],
            } for c in team_chars
        ]
    })


# =============================================
# ROTAS DE PVP
# =============================================

K_ELO = 32


def get_team_power(user_id):
    return db.query(
        """SELECT ut.slot, uc.id as user_character_id, uc.hp, uc.max_hp, uc.atk, uc.def, uc.speed,
                  c.name, c.rarity, c.element, c.role,
                  c.image_url, c.image_idle_url, c.gif_attack_url, c.gif_defend_url,
                  c.gif_hit_url, c.gif_victory_url, c.gif_defeat_url
           FROM user_teams ut
           JOIN user_characters uc ON ut.user_character_id = uc.id
           JOIN characters c ON uc.character_id = c.id
           WHERE ut.user_id = ?
           ORDER BY ut.slot""",
        (user_id,)
    )


def simulate_battle(attacker_team, defender_team):
    log = []
    events = []
    attacker_alive = [{**c, 'currentHp': c['max_hp'] or c['hp']} for c in attacker_team]
    defender_alive = [{**c, 'currentHp': c['max_hp'] or c['hp']} for c in defender_team]

    max_turns = 30
    attacker_won = False

    for turn in range(1, max_turns + 1):
        # Ataque do atacante
        for unit in attacker_alive:
            if unit['currentHp'] <= 0:
                continue
            target = next((d for d in defender_alive if d['currentHp'] > 0), None)
            if not target:
                attacker_won = True
                break
            damage = max(1, int(unit['atk'] - target['def'] * 0.3))
            target['currentHp'] -= damage
            log.append(f'Turno {turn}: {unit["name"]} ataca {target["name"]} (-{format_number(damage)})')
            events.append({
                'type': 'attack', 'turn': turn,
                'attacker': unit['name'], 'attacker_id': unit['user_character_id'],
                'target': target['name'], 'target_id': target['user_character_id'],
                'damage': damage, 'damage_formatted': format_number(damage),
                'target_hp': max(0, int(target['currentHp'])),
            })
            if target['currentHp'] <= 0:
                log.append(f'{target["name"]} foi derrotado!')
                events.append({
                    'type': 'defeated', 'turn': turn,
                    'target': target['name'], 'target_id': target['user_character_id'], 'target_hp': 0
                })

        if attacker_won:
            break
        if not any(d['currentHp'] > 0 for d in defender_alive):
            attacker_won = True
            break

        # Ataque do defensor
        for unit in defender_alive:
            if unit['currentHp'] <= 0:
                continue
            target = next((a for a in attacker_alive if a['currentHp'] > 0), None)
            if not target:
                break
            damage = max(1, int(unit['atk'] - target['def'] * 0.3))
            target['currentHp'] -= damage
            log.append(f'Turno {turn}: {unit["name"]} ataca {target["name"]} (-{format_number(damage)})')
            events.append({
                'type': 'attack', 'turn': turn,
                'attacker': unit['name'], 'attacker_id': unit['user_character_id'],
                'target': target['name'], 'target_id': target['user_character_id'],
                'damage': damage, 'damage_formatted': format_number(damage),
                'target_hp': max(0, int(target['currentHp'])),
            })
            if target['currentHp'] <= 0:
                log.append(f'{target["name"]} foi derrotado!')
                events.append({
                    'type': 'defeated', 'turn': turn,
                    'target': target['name'], 'target_id': target['user_character_id'], 'target_hp': 0
                })

        if not any(a['currentHp'] > 0 for a in attacker_alive):
            break

    if attacker_won:
        return {'attackerWon': True, 'log': log, 'events': events}

    attacker_has_alive = any(a['currentHp'] > 0 for a in attacker_alive)
    defender_has_alive = any(d['currentHp'] > 0 for d in defender_alive)

    return {'attackerWon': attacker_has_alive and not defender_has_alive, 'log': log, 'events': events}


@app.route('/api/pvp/ranking', methods=['GET'])
@require_auth
def get_ranking():
    ranking = db.query(
        """SELECT r.rating, r.wins, r.losses, r.rank,
                  u.id as user_id, u.username, u.level, u.avatar_url
           FROM rankings r
           JOIN users u ON r.user_id = u.id
           ORDER BY r.rating DESC
           LIMIT 50"""
    )

    formatted = []
    for index, entry in enumerate(ranking):
        winrate = int((entry['wins'] / (entry['wins'] + entry['losses'])) * 100) if entry['wins'] + entry['losses'] > 0 else 0
        formatted.append({**entry, 'rank': index + 1, 'winrate': winrate})

    my_row = db.get(
        """SELECT COUNT(*) as position FROM rankings r
           JOIN users u ON r.user_id = u.id
           WHERE r.rating > (SELECT rating FROM rankings WHERE user_id = ?)""",
        (request.user['id'],)
    )
    my_ranking = db.get('SELECT rating, wins, losses FROM rankings WHERE user_id = ?', (request.user['id'],))

    return jsonify({
        'ranking': formatted,
        'my_position': my_row['position'] + 1 if my_ranking else None,
        'my_rating': my_ranking['rating'] if my_ranking else 1000,
        'my_wins': my_ranking['wins'] if my_ranking else 0,
        'my_losses': my_ranking['losses'] if my_ranking else 0,
    })


@app.route('/api/pvp/opponents', methods=['GET'])
@require_auth
def get_opponents():
    my_rating = db.get('SELECT rating FROM rankings WHERE user_id = ?', (request.user['id'],))
    base_rating = my_rating['rating'] if my_rating else 1000

    opponents = db.query(
        """SELECT u.id as user_id, u.username, u.level, u.avatar_url,
                  r.rating, r.wins, r.losses,
                  (SELECT COUNT(*) FROM user_characters WHERE user_id = u.id) as units_count,
                  (SELECT COUNT(*) FROM user_teams WHERE user_id = u.id) as team_count,
                  (SELECT c.image_url FROM user_teams ut
                   JOIN user_characters uc ON ut.user_character_id = uc.id
                   JOIN characters c ON uc.character_id = c.id
                   WHERE ut.user_id = u.id ORDER BY ut.slot LIMIT 1) as team_avatar
           FROM rankings r
           JOIN users u ON r.user_id = u.id
           WHERE u.id != ? AND (SELECT COUNT(*) FROM user_teams WHERE user_id = u.id) > 0
               ORDER BY ABS(r.rating - ?) ASC""",
        (request.user['id'], base_rating)
    )

    return jsonify({'opponents': opponents})


@app.route('/api/pvp/battle', methods=['POST'])
@require_auth
def challenge_pvp():
    data = request.get_json(silent=True) or {}
    defender_id = data.get('defender_id')

    if not defender_id:
        return jsonify({'error': 'defender_id é obrigatório'}), 400
    if defender_id == request.user['id']:
        return jsonify({'error': 'Você não pode desafiar a si mesmo'}), 400

    attacker_team = get_team_power(request.user['id'])
    if not attacker_team:
        return jsonify({'error': 'Monte um time antes de batalhar'}), 400

    defender_team = get_team_power(defender_id)
    if not defender_team:
        return jsonify({'error': 'Oponente não possui time montado'}), 404

    battle = simulate_battle(attacker_team, defender_team)

    attacker_rating_row = db.get('SELECT rating FROM rankings WHERE user_id = ?', (request.user['id'],))
    defender_rating_row = db.get('SELECT rating FROM rankings WHERE user_id = ?', (defender_id,))

    attacker_rating = attacker_rating_row['rating'] if attacker_rating_row else 1000
    defender_rating = defender_rating_row['rating'] if defender_rating_row else 1000

    expected = 1 / (1 + 10 ** ((defender_rating - attacker_rating) / 400))

    if battle['attackerWon']:
        attacker_delta = int(K_ELO * (1 - expected))
        defender_delta = -int(K_ELO * expected)
    else:
        attacker_delta = int(K_ELO * (0 - expected))
        defender_delta = int(K_ELO * (1 - expected))

    db.execute(
        'UPDATE rankings SET rating = rating + ?, wins = wins + ?, losses = losses + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        (attacker_delta if battle['attackerWon'] else 0, 1 if battle['attackerWon'] else 0, 0 if battle['attackerWon'] else 1, request.user['id'])
    )
    db.execute(
        'UPDATE rankings SET rating = rating + ?, wins = wins + ?, losses = losses + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        (0 if battle['attackerWon'] else defender_delta, 0 if battle['attackerWon'] else 1, 1 if battle['attackerWon'] else 0, defender_id)
    )

    db.execute(
        'INSERT INTO battle_results (attacker_id, defender_id, winner_id, attacker_team, defender_team, battle_log) VALUES (?, ?, ?, ?, ?, ?)',
        (request.user['id'], defender_id,
         request.user['id'] if battle['attackerWon'] else defender_id,
         json.dumps([c['name'] for c in attacker_team]),
         json.dumps([c['name'] for c in defender_team]),
         json.dumps(battle['log']))
    )

    register_progress(request.user['id'], 'pvp')
    if battle['attackerWon']:
        register_progress(request.user['id'], 'pvp_win')

    defender = db.get('SELECT username FROM users WHERE id = ?', (defender_id,))

    return jsonify({
        'victory': battle['attackerWon'],
        'message': f'Vitória contra {defender["username"]}!' if battle['attackerWon'] else f'Derrota para {defender["username"]}.',
        'opponent': {'id': defender_id, 'username': defender['username']},
        'rating_change': attacker_delta,
        'new_rating': attacker_rating + attacker_delta,
        'log': battle['log'],
        'events': battle['events'],
        'attacker_team': attacker_team,
        'defender_team': defender_team,
    })


# =============================================
# ROTAS DE HEALTH E ESTÁTICOS
# =============================================

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'service': 'gacha-game-api',
        'environment': 'development',
        'timestamp': datetime.datetime.now().isoformat()
    })


@app.route('/')
def index():
    return send_from_directory(str(CLIENT_DIR), 'index.html')


@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(str(ASSETS_DIR), filename)


# =============================================
# INICIALIZAÇÃO
# =============================================

def create_app():
    """Cria e configura a aplicação Flask"""
    seed()
    return app


if __name__ == '__main__':
    create_app()
    print('🚀 Servidor gacha-game rodando em http://localhost:5000')
    app.run(host='127.0.0.1', port=5000, debug=False)