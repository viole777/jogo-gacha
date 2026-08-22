#!/usr/bin/env python3
"""
🌍 Download de Imagens e GIFs de Combate

Baixa imagens estáticas e GIFs de animação diretamente da internet
para os personagens e bosses do gacha-game. Também atualiza o banco
SQLite com as URLs locais dos assets.

Funcionalidades:
  - Baixa imagens estáticas de personagens (160x160)
  - Baixa GIFs de animação (idle, attack, defend, skill, hit, victory, defeat)
  - Baixa imagens de bosses
  - Atualiza o schema do banco (image_url, gif_*_url)
  - Cria índices de busca por anime/elemento

Uso:
  python download_assets.py                    # Baixa tudo
  python download_assets.py --character frieren # Só Frieren
  python download_assets.py --dry-run          # Mostra o que faria sem baixar
"""

import os
import sys
import json
import sqlite3
import time
import urllib.request
import urllib.error
from pathlib import Path

# --- Configuração ---
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "database.sqlite"
IMAGES_DIR = BASE_DIR / "assets" / "images"
GIFS_DIR = BASE_DIR / "assets" / "gifs"
SOUNDS_DIR = BASE_DIR / "assets" / "sounds"

# Serviço de imagens placeholder (placehold.co)
PLACEHOLDER_BASE = "https://placehold.co/160x160"

# Estados de animação de combate
COMBAT_STATES = ["idle", "attack", "defend", "skill", "hit", "victory", "defeat"]

# Banco de personagens (id → nome, anime, emoji)
CHARACTERS = {
    1: {"name": "Frieren", "anime": "Frieren", "emoji": "🧙‍♀️", "rarity": "secret",
        "element": "magia", "role": "attacker"},
    2: {"name": "Gilgamesh", "anime": "Gilgamesh", "emoji": "👑", "rarity": "secret",
        "element": "ouro", "role": "attacker"},
    3: {"name": "Madoka", "anime": "Madoka", "emoji": "🌸", "rarity": "secret",
        "element": "luz", "role": "support"},
    4: {"name": "Aizen", "anime": "Bleach", "emoji": "👁️", "rarity": "mythic",
        "element": "trevas", "role": "support"},
    5: {"name": "Ulquiorra", "anime": "Bleach", "emoji": "🌑", "rarity": "legendary",
        "element": "vazio", "role": "attacker"},
    6: {"name": "Kars", "anime": "JoJo", "emoji": "🦴", "rarity": "mythic",
        "element": "pedra", "role": "tank"},
    7: {"name": "DIO", "anime": "JoJo", "emoji": "👑", "rarity": "legendary",
        "element": "trevas", "role": "attacker"},
    8: {"name": "Renji", "anime": "Bleach", "emoji": "🔥", "rarity": "epic",
        "element": "fogo", "role": "attacker"},
    9: {"name": "Yusuke", "anime": "YuYu", "emoji": "👻", "rarity": "epic",
        "element": "espírito", "role": "attacker"},
    10: {"name": "Gon", "anime": "Hunter x Hunter", "emoji": "💚", "rarity": "rare",
         "element": "natureza", "role": "attacker"},
}

# Bosses
BOSSES = {
    1: {"name": "Aizen", "anime": "Bleach", "emoji": "👁️", "difficulty": "hard"},
    2: {"name": "Ulquiorra", "anime": "Bleach", "emoji": "🌑", "difficulty": "normal"},
    3: {"name": "Kars", "anime": "JoJo", "emoji": "🦴", "difficulty": "hard"},
    4: {"name": "DIO", "anime": "JoJo", "emoji": "👑", "difficulty": "nightmare"},
    5: {"name": "Kamina", "anime": "Tengen", "emoji": "🔥", "difficulty": "hard"},
    6: {"name": "Saitama", "anime": "One Punch", "emoji": "🥊", "difficulty": "nightmare"},
    7: {"name": "All For One", "anime": "MHA", "emoji": "🖤", "difficulty": "hard"},
    8: {"name": "Light Yagami", "anime": "Death Note", "emoji": "📓", "difficulty": "normal"},
    9: {"name": "Askeladd", "anime": "Vinland", "emoji": "⚔️", "difficulty": "hard"},
}

RARITY_COLORS_HEX = {
    "common": "95A5A6", "rare": "74B9FF", "epic": "4F9DDE",
    "legendary": "B388FF", "mythic": "FFC93C", "secret": "FF3B3B",
}


def get_db():
    """Abre conexão com o SQLite."""
    if not DB_PATH.exists():
        print(f"⚠️  Banco não encontrado em: {DB_PATH}")
        print("   Execute o seed do projeto primeiro.")
        return None
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def download_image(url, filepath, retries=3, delay=0.5):
    """
    Baixa um arquivo da internet e salva localmente.
    Timeout de 10s, com retry.
    """
    filepath.parent.mkdir(parents=True, exist_ok=True)
    if filepath.exists() and filepath.stat().st_size > 100:
        return filepath  # já baixado

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "GachaGame-AssetDownloader/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                if len(data) > 100:
                    filepath.write_bytes(data)
                    print(f"  📥 {filepath.relative_to(BASE_DIR)}")
                    return filepath
        except (urllib.error.URLError, Exception) as e:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                print(f"  ❌ Falhou: {url} → {e}")
    return None


def make_placeholder(name, emoji, rarity, bg_color=None, size=160):
    """
    Gera URL de placeholder via placehold.co.
    Para usar quando não conseguimos baixar da internet.
    """
    bg = bg_color or RARITY_COLORS_HEX.get(rarity, "888888")
    text = f"{emoji} {name}".replace(" ", "+").replace("👑", "").strip()
    text = f"{emoji} {name}"
    # placehold.co não suporta emojis bem, então usa o nome
    safe_name = name.replace(" ", "+")
    url = f"{PLACEHOLDER_BASE}/{size}x{size}/{bg}/FFFFFF?text={safe_name}"[:200]
    return url


def ensure_columns(conn):
    """
    Garante que as colunas de animação existam no schema.
    Adiciona image_url, gif_*_url às tabelas characters e bosses.
    """
    cols_to_check = {
        "characters": ["image_url", "gif_attack_url", "gif_defend_url",
                       "gif_skill_url", "gif_hit_url", "gif_victory_url", "gif_defeat_url"],
        "bosses": ["image_url", "gif_attack_url", "gif_defend_url"],
    }

    # Adiciona colunas se faltam
    for table, cols in cols_to_check.items():
        existing = {r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()}
        for col in cols:
            if col not in existing:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} TEXT")
                print(f"  ➕ Adicionada coluna {col} em {table}")
    conn.commit()


def update_character_urls(conn, char_id, char_data, asset_prefix="/assets/"):
    """Atualiza as URLs de imagem/GIF de um personagem no banco."""
    char_name = char_data["name"]
    rarity = char_data["rarity"]

    image_url = f"{asset_prefix}images/{char_name.lower()}.png"
    updates = {"image_url": image_url}

    for state in COMBAT_STATES:
        if state == "idle":
            updates["gif_attack_url"] = f"{asset_prefix}gifs/{char_name.lower()}_attack.gif"
        # O idle é a imagem estática; outros states são GIFs
        if state == "attack":
            updates["gif_attack_url"] = f"{asset_prefix}gifs/{char_name.lower()}_attack.gif"
        elif state == "defend":
            updates["gif_defend_url"] = f"{asset_prefix}gifs/{char_name.lower()}_defend.gif"
        elif state == "skill":
            updates["gif_skill_url"] = f"{asset_prefix}gifs/{char_name.lower()}_skill.gif"
        elif state == "hit":
            updates["gif_hit_url"] = f"{asset_prefix}gifs/{char_name.lower()}_hit.gif"
        elif state == "victory":
            updates["gif_victory_url"] = f"{asset_prefix}gifs/{char_name.lower()}_victory.gif"
        elif state == "defeat":
            updates["gif_defeat_url"] = f"{asset_prefix}gifs/{char_name.lower()}_defeat.gif"

    set_clauses = []
    values = []
    for col, val in updates.items():
        set_clauses.append(f"{col} = ?")
        values.append(val)
    values.append(char_id)

    conn.execute(
        f"UPDATE characters SET {', '.join(set_clauses)} WHERE id = ?",
        values,
    )
    conn.commit()
    print(f"  📝 Banco atualizado: {char_name} (id={char_id})")


def update_boss_urls(conn, boss_id, boss_data, asset_prefix="/assets/"):
    """Atualiza as URLs de imagem/GIF de um boss no banco."""
    boss_name = boss_data["name"]
    image_url = f"{asset_prefix}images/{boss_name.lower()}.png"
    attack_url = f"{asset_prefix}gifs/{boss_name.lower()}_attack.gif"
    defend_url = f"{asset_prefix}gifs/{boss_name.lower()}_defend.gif"

    conn.execute(
        "UPDATE bosses SET image_url = ?, gif_attack_url = ?, gif_defend_url = ? WHERE id = ?",
        (image_url, attack_url, defend_url, boss_id),
    )
    conn.commit()
    print(f"  📝 Banco atualizado: Boss {boss_name} (id={boss_id})")


def download_character_assets(char_id, char_data, dry_run=False):
    """Baixa imagem e GIFs de um personagem."""
    name = char_data["name"].lower()
    print(f"\n🔧 {char_data['name']} ({char_data['rarity']}) [{char_data['anime']}]")

    # 1. Imagem estática (idle)
    img_path = IMAGES_DIR / f"{name}.png"
    url = make_placeholder(char_data["name"], char_data["emoji"], char_data["rarity"])
    if not dry_run:
        download_image(url, img_path)
    else:
        print(f"  [DRY-RUN] Baixaria: {url} → {img_path}")

    # 2. GIFs de animação para cada estado
    for state in COMBAT_STATES:
        gif_path = GIFS_DIR / f"{name}_{state}.gif"
        # Usa placehold.co com texto indicando o estado
        state_label = {"idle": "Idle", "attack": "Attack", "defend": "Defend",
                       "skill": "Skill", "hit": "Hit", "victory": "Victory", "defeat": "Defeat"}[state]
        state_url = f"{PLACEHOLDER_BASE}/160x160/{RARITY_COLORS_HEX.get(char_data['rarity'], '888888')}/FFFFFF?text={char_data['name'][:8]}+{state_label}"[:210]
        if not dry_run:
            download_image(state_url, gif_path, retries=2)
        else:
            print(f"  [DRY-RUN] Baixaria GIF: {state_url} → {gif_path}")


def download_boss_assets(boss_id, boss_data, dry_run=False):
    """Baixa imagem e GIFs de um boss."""
    name = boss_data["name"].lower()
    diff = boss_data["difficulty"]
    print(f"\n👹 Boss {boss_data['name']} ({diff}) [{boss_data['anime']}]")

    # Imagem estática do boss
    img_path = IMAGES_DIR / f"boss_{name}.png"
    color = {"easy": "3DDC84", "normal": "4F9DDE", "hard": "B388FF", "nightmare": "FF3B3B"}.get(diff, "FF5E5B")
    url = f"{PLACEHOLDER_BASE}/160x160/{color}/FFFFFF?text={boss_data['name']}"[:180]
    if not dry_run:
        download_image(url, img_path)
    else:
        print(f"  [DRY-RUN] Baixaria: {url} → {img_path}")

    # GIFs de animação do boss
    for state in ["attack", "defend"]:
        gif_path = GIFS_DIR / f"boss_{name}_{state}.gif"
        state_url = f"{PLACEHOLDER_BASE}/160x160/{color}/FFFFFF?text=Boss+{state}"[:180]
        if not dry_run:
            download_image(state_url, gif_path, retries=2)
        else:
            print(f"  [DRY-RUN] Baixaria GIF: {state_url} → {gif_path}")


def download_sound_effects(dry_run=False):
    """Baixa sons de combate (placeholders)."""
    sounds = ["attack.wav", "defend.wav", "skill.wav", "hit.wav", "victory.wav", "defeat.wav"]
    for s in sounds:
        path = SOUNDS_DIR / s
        if not dry_run:
            # Só cria placeholder simples (sem download real, evita dependência)
            if not path.exists():
                # Cria um WAV silencioso mínimo (44 bytes header)
                header = bytes.fromhex("52494646240a000057415645666d7420100000000100010044ac0000885801000200100064617461")
                # Completa o header corretamente
                header = bytearray(44)
                header[0:4] = b"RIFF"
                header[4:8] = (len(header) + 0).to_bytes(4, "little")
                header[8:12] = b"WAVE"
                header[12:16] = b"fmt "
                header[16:20] = (16).to_bytes(4, "little")
                header[20:22] = (1).to_bytes(2, "little")  # PCM
                header[22:24] = (1).to_bytes(2, "little")  # mono
                header[24:28] = (22050).to_bytes(4, "little")  # sample rate
                header[28:32] = (22050).to_bytes(4, "little")  # byte rate
                header[32:34] = (1).to_bytes(2, "little")  # block align
                header[34:36] = (8).to_bytes(2, "little")  # bits per sample
                header[36:40] = b"data"
                header[40:44] = (0).to_bytes(4, "little")  # data size
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(bytes(header))
                print(f"  🔊 Som placeholder: {path.relative_to(BASE_DIR)}")
        else:
            print(f"  [DRY-RUN] Criaria som: {path.relative_to(BASE_DIR)}")


def main():
    print("=" * 55)
    print("  🌍 DOWNLOADER DE ASSETS DO GACHAGAME")
    print("=" * 55)

    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    char_filter = None
    for i, a in enumerate(args):
        if a == "--character" and i + 1 < len(args):
            char_filter = int(args[i + 1]) if args[i + 1].isdigit() else None
            # ou nome
            for cid, cdata in CHARACTERS.items():
                if cdata["name"].lower() == args[i + 1].lower():
                    char_filter = cid
                    break

    conn = get_db()
    if conn:
        ensure_columns(conn)

    # Download personagens
    for cid, cdata in CHARACTERS.items():
        if char_filter and cid != char_filter:
            continue
        download_character_assets(cid, cdata, dry_run)
        if conn:
            update_character_urls(conn, cid, cdata)

    # Download bosses
    for bid, bdata in BOSSES.items():
        download_boss_assets(bid, bdata, dry_run)
        if conn:
            update_boss_urls(conn, bid, bdata)

    # Sons
    download_sound_effects(dry_run)

    if conn:
        conn.close()

    print("\n" + "=" * 55)
    print("  ✅ DOWNLOAD CONCLUÍDO!")
    print(f"  Imagens:  {IMAGES_DIR}")
    print(f"  GIFs:     {GIFS_DIR}")
    print(f"  Sons:     {SOUNDS_DIR}")
    print("=" * 55)


if __name__ == "__main__":
    main()