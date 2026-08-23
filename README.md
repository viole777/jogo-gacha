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

No painel do Render, confirme no serviço ativo: **Plan = Starter**, um disco persistente montado em `/var/data` e a variável `DB_PATH=/var/data/gacha-game.db`. O endpoint `/api/health` informa `database_persistence_configured: true` quando a variável está presente. Sem essa configuração, o servidor agora falha ao iniciar em produção em vez de usar um banco efêmero silenciosamente.

O servidor também cria até 10 backups completos em `BACKUP_DIR` (um imediatamente ao iniciar, depois a cada 15 minutos e outro no encerramento). Para proteger os backups contra a perda do próprio disco, configure `BACKUP_DIR` em um armazenamento externo ou faça cópia periódica para um serviço de objetos.
