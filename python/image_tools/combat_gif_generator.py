#!/usr/bin/env python3
"""
🎬 Gerador de GIFs de Combate (Pillow)

Gera GIFs animados a partir das imagens estáticas dos personagens.
Cada estado (idle, attack, defend, skill, hit, victory, defeat) recebe
uma animação diferente usando transformações Pillow.

Uso:
  python combat_gif_generator.py <input_image> <output_gif> <state>
  python combat_gif_generator.py <input_image> <output_dir> all
"""

import os
import sys
from PIL import Image, ImageOps, ImageEnhance

SIZE = (220, 280)
BG_COLOR = (255, 255, 255, 255)

# Duração por frame em ms
FRAME_DURATION = 120
# Total de frames por estado
FRAME_COUNT = 8


def load_and_resize(input_path):
    """Carrega e redimensiona a imagem para o tamanho padrão."""
    img = Image.open(input_path).convert("RGB")
    img = ImageOps.fit(img, SIZE, Image.LANCZOS)
    return img


def gen_idle(img):
    """Leve flutuação para cima e para baixo."""
    frames = []
    for i in range(FRAME_COUNT):
        offset = int(abs(i - FRAME_COUNT / 2) * 4)
        canvas = Image.new("RGBA", SIZE, BG_COLOR)
        canvas.paste(img, (0, offset))
        frames.append(canvas)
    return frames


def gen_attack(img):
    """Movimento lateral agressivo + zoom leve."""
    frames = []
    for i in range(FRAME_COUNT):
        canvas = Image.new("RGBA", SIZE, BG_COLOR)
        dx = int((i - FRAME_COUNT / 2) * 12)
        scale = 1.0 + (abs(i - FRAME_COUNT / 2) * 0.03)
        w = int(SIZE[0] * scale)
        h = int(SIZE[1] * scale)
        scaled = img.resize((w, h), Image.LANCZOS)
        ox = (SIZE[0] - w) // 2
        oy = (SIZE[1] - h) // 2
        canvas.paste(scaled, (ox + dx, oy))
        frames.append(canvas)
    return frames


def gen_defend(img):
    """Imagem tremendo para defender."""
    frames = []
    for i in range(FRAME_COUNT):
        canvas = Image.new("RGBA", SIZE, BG_COLOR)
        dx = (i % 2) * 8 - 4
        canvas.paste(img, (dx, 0))
        frames.append(canvas)
    return frames


def gen_skill(img):
    """Rotação suave com brilho."""
    frames = []
    for i in range(FRAME_COUNT):
        canvas = Image.new("RGBA", SIZE, BG_COLOR)
        angle = (i - FRAME_COUNT / 2) * 5
        rotated = img.rotate(angle, resample=Image.BICUBIC, expand=False)
        enhancer = ImageEnhance.Brightness(rotated)
        brightness = 0.8 + (abs(i - FRAME_COUNT / 2) / (FRAME_COUNT / 2)) * 0.6
        bright_img = enhancer.enhance(brightness)
        canvas.paste(bright_img, (0, 0))
        frames.append(canvas)
    return frames


def gen_hit(img):
    """Pulso de dano - zoom in/out + vermelho."""
    frames = []
    for i in range(FRAME_COUNT):
        canvas = Image.new("RGBA", SIZE, BG_COLOR)
        scale = 1.0 + abs(i - FRAME_COUNT / 2) * 0.08
        w = int(SIZE[0] * scale)
        h = int(SIZE[1] * scale)
        scaled = img.resize((w, h), Image.LANCZOS)
        ox = (SIZE[0] - w) // 2
        oy = (SIZE[1] - h) // 2

        # Tinge de vermelho
        r, g, b = scaled.split()
        red_overlay = Image.new("RGB", scaled.size, (255, 60, 60))
        blended = Image.blend(scaled, red_overlay, 0.3)

        canvas.paste(blended, (ox, oy))
        frames.append(canvas)
    return frames


def gen_victory(img):
    """Salto para cima com cor amarela."""
    frames = []
    for i in range(FRAME_COUNT):
        canvas = Image.new("RGBA", SIZE, BG_COLOR)
        dy = int(-abs(i - FRAME_COUNT / 2) * 15)
        enhancer = ImageEnhance.Brightness(img)
        bright = enhancer.enhance(1.0 + (i % 3) * 0.08)
        canvas.paste(bright, (0, dy))
        frames.append(canvas)
    return frames


def gen_defeat(img):
    """Esmaecer para cinza."""
    frames = []
    for i in range(FRAME_COUNT):
        canvas = Image.new("RGBA", SIZE, BG_COLOR)
        gray = ImageOps.grayscale(img)
        gray_rgb = gray.convert("RGB")
        # Interpola para cinza
        t = i / (FRAME_COUNT - 1)
        blended = Image.blend(img, gray_rgb, t * 0.8)
        canvas.paste(blended, (0, 0))
        frames.append(canvas)
    return frames


GENERATORS = {
    "idle": gen_idle,
    "attack": gen_attack,
    "defend": gen_defend,
    "skill": gen_skill,
    "hit": gen_hit,
    "victory": gen_victory,
    "defeat": gen_defeat,
}


def generate_gif(input_path, output_path, state):
    """Gera um GIF de animação para um estado."""
    img = load_and_resize(input_path)
    frames = GENERATORS[state](img)

    # Salva como GIF
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True,
        disposal=2,
    )
    print(f"  [GIF] {state}: {output_path}")


def generate_all(input_path, output_dir):
    """Gera GIFs para todos os estados."""
    for state, gen in GENERATORS.items():
        output_path = os.path.join(output_dir, f"_{state}.gif")
        generate_gif(input_path, output_path, state)


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Uso: python combat_gif_generator.py <input> <output> <state|all>")
        sys.exit(1)

    input_path = sys.argv[1]
    output = sys.argv[2]
    state = sys.argv[3]

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)

    if state == "all":
        generate_all(input_path, output)
    else:
        if state not in GENERATORS:
            print(f"Estado inválido: {state}. Válidos: {list(GENERATORS.keys())}")
            sys.exit(1)
        generate_gif(input_path, output, state)