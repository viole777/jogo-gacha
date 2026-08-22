"""
🎮 Gacha Game - Aplicação Desktop (PyWebview)

Abre o jogo em uma janela nativa sem precisar de Node.js.
Usa Flask como backend local e PyWebview como janela.

Uso:
  python -m python.game.main
  python python/game/main.py
"""

import os
import sys
import threading
import webbrowser
from pathlib import Path

# Garante que o diretório raiz está no path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import webview

from .server import create_app, app


def run_flask():
    """Roda o servidor Flask em background"""
    create_app()
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)


def main():
    """Inicia a aplicação desktop"""
    print('🎮 Iniciando Gacha Game...')

    # Inicia o Flask em thread separada
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Abre a janela PyWebview
    webview.create_window(
        '🎮 Gacha Game',
        'http://127.0.0.1:5000',
        width=1280,
        height=800,
        min_size=(900, 600),
        resizable=True,
        fullscreen=False,
    )
    webview.start()


if __name__ == '__main__':
    main()