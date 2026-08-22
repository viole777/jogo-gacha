#!/usr/bin/env python3
"""
🎲 Simulador de Taxas do Gacha Game

Simula milhões de pulls para validar as probabilidades dos banners:
  - Distribuição de raridades (common, rare, epic, legendary, mythic, secret)
  - Pity system (garantia de raridade alta a cada N pulls)
  - Estatísticas de outcome

Uso:
  python gacha_simulator.py                         # Simula 100k pulls
  python gacha_simulator.py --pulls 1000000         # 1M pulls
  python gacha_simulator.py --banner 1              # Usa banner específico
"""

import random
import sys
import json
from collections import Counter
from pathlib import Path

# Probabilidades base (drop_rate) — definidas no schema de banners
DEFAULT_RATES = {
    "common": 0.50,     # 50%
    "rare": 0.25,       # 25%
    "epic": 0.15,       # 15%
    "legendary": 0.06,  # 6%
    "mythic": 0.035,    # 3.5%
    "secret": 0.005,    # 0.5%
}

RARITY_ORDER = ["common", "rare", "epic", "legendary", "mythic", "secret"]


def load_rates_from_db():
    """Carrega as taxas do banco de dados SQLite (se disponível)."""
    db_path = Path(__file__).resolve().parent.parent.parent / "database.sqlite"
    if not db_path.exists():
        return None
    try:
        import sqlite3
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT rarity, drop_rate FROM banner_items WHERE drop_rate > 0").fetchall()
        conn.close()
        if rows:
            rates = {}
            total = 0
            for r in rows:
                rates[r["rarity"]] = r["drop_rate"]
                total += r["drop_rate"]
            if total > 0:
                for k in rates:
                    rates[k] = rates[k] / total
            return rates
    except Exception:
        pass
    return None


def weighted_choice(rates):
    """Escolhe uma raridade baseada nas taxas ponderadas."""
    r = random.random()
    cumulative = 0
    for rarity in RARITY_ORDER:
        cumulative += rates.get(rarity, 0)
        if r <= cumulative:
            return rarity
    return "common"


def simulate_pulls(n_pulls, rates, use_pity=True):
    """
    Simula N pulls e retorna a distribuição de resultados.

    Pity system:
      - Após 50 pulls sem legendary+, garante um legendary ou melhor
      - Após 200 pulls sem mythic/secret, garante um mythic ou melhor
      - Após 1000 pulls sem secret, garante um secret
    """
    results = Counter()
    pity_50 = 0  # pity para legendary+
    pity_200 = 0  # pity para mythic+
    pity_1000 = 0  # pity para secret

    for i in range(n_pulls):
        pity_50 += 1
        pity_200 += 1
        pity_1000 += 1

        # Aplica pity
        if use_pity:
            if pity_1000 >= 1000:
                rarity = "secret"
            elif pity_200 >= 200:
                rarity = "mythic" if random.random() < 0.3 else "legendary"
            elif pity_50 >= 50:
                rarity = random.choice(["legendary", "mythic", "secret"])
            else:
                rarity = weighted_choice(rates)
        else:
            rarity = weighted_choice(rates)

        results[rarity] += 1

        # Reseta pity baseado no resultado
        if rarity in ("secret",):
            pity_50 = 0
            pity_200 = 0
            pity_1000 = 0
        elif rarity in ("mythic", "legendary"):
            pity_50 = 0
            if rarity == "mythic":
                pity_200 = 0

    return results


def main():
    # Parse args
    n_pulls = 100000
    use_pity = True
    use_db_rates = False

    args = sys.argv[1:]
    for i, a in enumerate(args):
        if a == "--pulls" and i + 1 < len(args):
            n_pulls = int(args[i + 1])
        elif a == "--no-pity":
            use_pity = False
        elif a == "--db":
            use_db_rates = True

    print("=" * 55)
    print("  🎲 SIMULADOR DE TAXAS DO GACHAGAME")
    print("=" * 55)
    print(f"  Pulls: {n_pulls:,}")
    print(f"  Pity system: {'ON' if use_pity else 'OFF'}")

    rates = DEFAULT_RATES
    if use_db_rates:
        db_rates = load_rates_from_db()
        if db_rates:
            rates = db_rates
            print(f"  Fonte de taxas: BANCO DE DADOS")
        else:
            print(f"  Fonte de taxas: DEFAULT (DB não disponível)")
    else:
        print(f"  Fonte de taxas: DEFAULT")

    print(f"\n  Taxas esperadas:")
    for r in RARITY_ORDER:
        pct = rates.get(r, 0) * 100
        print(f"    {r:10s}: {pct:5.2f}%")

    print(f"\n  🎯 Simulando {n_pulls:,} pulls...")
    results = simulate_pulls(n_pulls, rates, use_pity)

    print(f"\n{'='*40}")
    print(f"  RESULTADOS DA SIMULAÇÃO")
    print(f"{'='*40}")
    print(f"  {'Raridade':<12} {'Quantidade':>10} {'Taxa Real':>12} {'Taxa Esperada':>14}")
    print(f"  {'-'*40}")
    for r in RARITY_ORDER:
        count = results.get(r, 0)
        actual = count / n_pulls * 100
        expected = rates.get(r, 0) * 100
        marker = "✓" if abs(actual - expected) < 1 else "~"
        print(f"  {r:<12} {count:>10,} {actual:>10.2f}% {expected:>12.2f}%  {marker}")

    total_rare_plus = sum(results.get(r, 0) for r in RARITY_ORDER if r != "common" and r != "rare")
    total_5star = sum(results.get(r, 0) for r in ["legendary", "mythic", "secret"])
    total_secret = results.get("secret", 0)

    print(f"\n  🎯 Resumo:")
    print(f"    Personagens raros+ (epic+): {total_rare_plus:,} ({total_rare_plus/n_pulls*100:.2f}%)")
    print(f"    5★+ (legendary/mythic/secret): {total_5star:,} ({total_5star/n_pulls*100:.2f}%)")
    print(f"    Secrets: {total_secret:,} ({total_secret/n_pulls*100:.2f}%)")
    print(f"    Pulls por secret: {n_pulls/total_secret:.0f}" if total_secret > 0 else "    Sem secrets")

    # Pity analysis
    avg_without_pity = n_pulls / (results.get("secret", 0) or 1)
    print(f"\n  💡 Análise de Pity:")
    avg_expected = 1 / rates.get("secret", 0.005)
    print(f"    Pulls teóricos por secret (sem pity): {avg_expected:.0f}")
    print(f"    Pulls simulados por secret (com pity): {n_pulls/(results.get('secret',0) or 1):.0f}")


if __name__ == "__main__":
    main()