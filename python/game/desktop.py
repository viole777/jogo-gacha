"""
🎮 Gacha Game - Entry Point para build do executável (.exe)

Este arquivo é usado pelo PyInstaller para gerar o gacha-game.exe.
Configura os caminhos antes de importar o servidor.
"""

import os
import sys
import time
import threading
from pathlib import Path


def get_base_dir():
    """Retorna o diretório base (funciona tanto em dev quanto no .exe)"""
    if getattr(sys, 'frozen', False):
        # Rodando como executável PyInstaller: assets estão em _MEIPASS
        return Path(sys._MEIPASS)
    # Rodando em dev: raiz do projeto
    return Path(__file__).resolve().parent.parent.parent


BASE_DIR = get_base_dir()

# Configura caminhos ANTES de importar qualquer módulo do jogo
if getattr(sys, 'frozen', False):
    # Banco de dados vai para AppData do usuário (persistente entre execuções)
    user_data = Path(os.environ.get('APPDATA', str(Path.home()))) / 'GachaGame'
    user_data.mkdir(parents=True, exist_ok=True)
    os.environ['DB_PATH'] = str(user_data / 'gacha-game.db')

# Garante que a raiz do projeto está no path (para imports python.game.*)
project_root = str(BASE_DIR)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Em dev, também garante que a pasta python/ está acessível como pacote
dev_root = str(Path(__file__).resolve().parent.parent.parent)
if dev_root not in sys.path:
    sys.path.insert(0, dev_root)

import webview  # noqa: E402
from python.game.server import app, create_app  # noqa: E402


def run_flask():
    """Roda o servidor Flask em background"""
    create_app()
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)


def main():
    print('🎮 Iniciando Gacha Game...')

    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    time.sleep(1)  # Aguarda o Flask subir

    webview.create_window(
        '🎮 Gacha Game',
        'http://127.0.0.1:5000',
        width=1280,
        height=800,
        min_size=(900, 600),
        resizable=True,
    )
    webview.start()


if __name__ == '__main__':
    main()