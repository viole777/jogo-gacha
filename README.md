# 🎮 Gacha Game

Um jogo de **Gacha baseado em universos de anime**, onde você coleta personagens, monta seu time e enfrenta desafios cada vez mais difíceis.

### ✨ Principais recursos

*  **Gacha:** obtenha personagens de diferentes raridades.
*  **Coleção:** organize, favorite, evolua e monte seu time.
*  **Bosses:** enfrente chefes em batalhas animadas.
*  **PvP:** dispute contra outros jogadores e suba no ranking.
*  **Ranking global:** compete pelo Top 50 mundial.
*  **Missões:** complete desafios diários, semanais e de história.
*  **Login diário:** receba recompensas por manter sua sequência.
*  **Loja:** compre itens e negocie personagens.
*  **Sistema de áudio:** efeitos de batalha, vitória e derrota.

O projeto combina **coleção, estratégia, progressão e competição**, criando uma experiência inspirada nos tradicionais jogos de gacha e anime.

### Persistência em produção

O progresso dos jogadores é armazenado em SQLite. Em produção, o serviço precisa usar o disco persistente configurado em `render.yaml` e manter `DB_PATH=/var/data/gacha-game.db`. Um filesystem efêmero pode apagar contas, gemas, unidades e ranking durante um redeploy.
