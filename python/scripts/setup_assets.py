#!/usr/bin/env python3
"""
🚀 Setup de Assets do Gacha Game

Instala as dependências (Pillow) e gera todos os assets:
  - Imagens estáticas de personagens
  - GIFs de animação de combate (idle, attack, defend, skill, hit, victory, defeat)
  - GIFs de animação de bosses
  - Sons de combate (placeholder WAV)
"""

import subprocess
import sys
import os

def install_pillow():
    """Instala o Pillow se não estiver disponível."""
    try:
        from PIL import Image
        print("✅ Pillow já está instalado!")
        return True
    except ImportError:
        print("📦 Instalando Pillow...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
        from PIL import Image
        print("✅ Pillow instalado com sucesso!")
        return True

def install_numpy():
    """Instala numpy para simulações estatísticas."""
    try:
        import numpy
        print("✅ numpy já está instalado!")
        return True
    except ImportError:
        print("📦 Instalando numpy...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "numpy"])
            print("✅ numpy instalado com sucesso!")
            return True
        except Exception:
            print("⚠️  numpy não instalado (usando fallback).")
            return False

if __name__ == "__main__":
    print("=" * 50)
    print("  📦 SETUP DE ASSETS DO GACHAGAME")
    print("=" * 50)

    install_pillow()
    install_numpy()

    print("\n🔧 Gerando assets de combate...")
    # Importa e roda o gerador de GIFs
    script_dir = os.path.dirname(__file__)
    image_tools_dir = os.path.join(script_dir, "..", "image_tools")
    sys.path.insert(0, os.path.abspath(image_tools_dir))

    from combat_gif_generator import main as gen_main
    gen_main()

    print("\n" + "=" * 50)
    print("  ✅ SETUP CONCLUÍDO!")
    print("  Assets em: /assets/images/ e /assets/gifs/")
    print("=" * 50)
