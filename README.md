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

Sim. Agora ficou claro: você quer manter o README atual como base, mas acrescentar uma seção “Coisas a fazer” que seja realmente focada no que ainda falta melhorar — principalmente início do jogo, diversão, envolvimento e visual, sem ficar repetindo Gacha, coleção, bosses, PvP etc. que já existem.

Eu colocaria algo assim no final do seu README:

Seção de tarefas e roadmap para o README
🚧 Coisas a fazer

O jogo já possui os principais sistemas de Gacha, coleção, evolução, bosses, PvP, ranking, missões, login diário, loja e áudio.

As próximas melhorias têm como objetivo principalmente deixar a experiência mais divertida, visualmente interessante, fácil para novos jogadores e menos dependente de bosses para progredir.

🌱 Melhorar o início do jogo

Atualmente, uma das prioridades é tornar os primeiros minutos mais interessantes e fáceis de entender.

O jogador novo deve conseguir evoluir e se divertir sem precisar imediatamente focar em bosses.

🎯 Jornada inicial

Criar uma sequência simples de objetivos para apresentar o jogo aos poucos:

 Criar um tutorial inicial interativo.
 Apresentar cada sistema gradualmente.
 Criar uma sequência de objetivos para os primeiros níveis.
 Dar recompensas frequentes durante o início.
 Evitar apresentar todas as funcionalidades de uma vez.
 Mostrar claramente qual é o próximo objetivo do jogador.
 Criar uma pequena sequência de introdução/história.

Exemplo:

🌱 SUA JORNADA

1. Faça sua primeira invocação
        ↓
2. Monte seu primeiro time
        ↓
3. Faça sua primeira batalha
        ↓
4. Evolua um personagem
        ↓
5. Complete uma missão
        ↓
6. Explore uma nova área
        ↓
7. Desbloqueie novas atividades


A ideia é fazer o jogador aprender jogando, e não através de uma grande quantidade de instruções.

🗺️ Criar formas alternativas de progressão

O jogador não deve precisar ficar repetindo bosses para conseguir evoluir.

Criar outras atividades que também forneçam recursos:

 Modo aventura.
 Fases normais.
 Exploração.
 Dungeons.
 Desafios rápidos.
 Minigames.
 Eventos aleatórios.
 Recompensas por exploração.
 Baús escondidos.
 Missões de NPCs.
 Recompensas por conquistas.

O jogador deve poder escolher como quer jogar.

              PROGRESSÃO
                  │
       ┌──────────┼──────────┐
       ↓          ↓          ↓
   ⚔️ Batalha   🗺️ Explorar  📜 Missões
       │          │          │
       ↓          ↓          ↓
     💰          💎         🎁
       │          │          │
       └──────────┼──────────┘
                  ↓
               📈 EVOLUIR

🎮 Criar um modo Aventura

Adicionar uma atividade focada em exploração e progressão.

Exemplo:

🌲 FLORESTA

[1] ── [2] ── [3]
              │
              ↓
             [4]
              │
              ↓
             [5]

❓ Evento desconhecido
📦 Baú
⚔️ Inimigo
💎 Recurso
👤 NPC


Cada área poderia ter pequenos acontecimentos diferentes.

Possibilidades
 Encontrar baús.
 Encontrar NPCs.
 Encontrar inimigos raros.
 Encontrar recursos.
 Encontrar caminhos secretos.
 Encontrar eventos aleatórios.
 Criar escolhas durante a exploração.
🎲 Eventos aleatórios

Adicionar situações inesperadas durante as atividades.

Exemplo:

❗ EVENTO!

Você encontrou um baú misterioso.

O que deseja fazer?

[ ABRIR ]

[ IGNORAR ]


Outras possibilidades:

Comerciante misterioso.
Personagem perdido.
Inimigo raro.
Baú secreto.
Recompensa inesperada.
Escolha entre dois caminhos.
Pequeno desafio.
Evento engraçado.

Isso ajudaria a evitar que cada partida pareça exatamente igual.

🧩 Minigames

Criar atividades rápidas que não dependam de batalha.

Ideias:

 Jogo de reflexo.
 Acertar alvos.
 Puzzle.
 Sequência de botões.
 Abrir baús.
 Desafio de tempo.
 Minigame de sorte.

Os minigames não precisam entregar recompensas enormes.

O objetivo é simplesmente criar variedade.

🎁 Tornar as recompensas mais divertidas

Melhorar a forma como as recompensas aparecem.

Em vez de simplesmente:

+500 moedas


criar uma pequena animação:

✨ RECOMPENSA!

       🪙
    +500 MOEDAS

       💥

Melhorias
 Animação de moedas.
 Animação de gemas.
 Animação de XP.
 Efeito visual ao subir de nível.
 Tela de recompensa.
 Partículas.
 Sons específicos.
 Recompensas surpresa.
🎨 Melhorias visuais

Uma das maiores prioridades é fazer o jogo parecer mais próximo de um jogo Gacha completo, e não apenas uma aplicação web.

🏠 Interface principal
 Criar uma Home mais bonita.
 Criar navegação visual.
 Criar cards para cada atividade.
 Destacar eventos atuais.
 Destacar recompensas disponíveis.
 Melhorar menus.
 Melhorar botões.
 Criar transições entre telas.
🃏 Melhorar visual dos personagens

Criar cards diferentes de acordo com a raridade.

Raridade comum

Visual simples.

Raridade alta

Adicionar:

 Glow.
 Borda especial.
 Partículas.
 Animação.
 Fundo personalizado.
Personagens extremamente raros

Criar uma apresentação especial:

✨ ✨ ✨ ✨ ✨

      NOVO!

   PERSONAGEM

✨ ✨ ✨ ✨ ✨

🌌 Backgrounds diferentes

Cada área do jogo deve possuir uma identidade visual.

 Menu principal.
 Gacha.
 Coleção.
 Batalha.
 Boss.
 Loja.
 Perfil.
 Aventura.
 Eventos.

Isso ajuda a criar a sensação de que o jogador está realmente entrando em lugares diferentes.

✨ Animações e efeitos

Adicionar microanimações em toda a interface.

 Hover nos botões.
 Cards com animação.
 Glow.
 Partículas.
 Transições.
 Barras animadas.
 Damage numbers.
 Efeitos de level up.
 Efeitos de vitória.
 Efeitos de recompensa.
🎰 Melhorar a experiência do Gacha

O sistema de Gacha já existe. A ideia aqui é melhorar a experiência visual e emocional da invocação.

Animação sugerida
🎰 INVOCAR
     ↓
🌑 Tela escurece
     ↓
✨ Energia aparece
     ↓
⚡ Energia aumenta
     ↓
🌈 Efeito de raridade
     ↓
👤 Silhueta
     ↓
💥 Explosão
     ↓
⭐ RARIDADE
     ↓
🎉 PERSONAGEM

Melhorias
 Animação diferente por raridade.
 Som diferente por raridade.
 Efeitos especiais para personagens raros.
 Animação especial para personagem novo.
 Animação especial para personagem repetido.
 Botão para pular animação depois de já ter visto.
 Histórico das últimas invocações.
📈 Progressão mais satisfatória

O jogador precisa sentir que está ficando mais forte constantemente.

Criar pequenos objetivos:

Nível 10
↓
Nova atividade

Nível 11
↓
Recompensa

Nível 12
↓
Novo desafio

Nível 13
↓
Novo upgrade

Nível 14
↓
Novo evento

Nível 15
↓
Nova área

Melhorias
 Mais desbloqueios por nível.
 Recompensas de progresso.
 Marcos de nível.
 Recompensas por coleção.
 Recompensas por evolução.
 Recompensas por exploração.
🔓 Desbloqueio gradual de sistemas

Evitar mostrar todas as funcionalidades logo no começo.

Exemplo:

Lv. 1 → 🎰 Gacha
Lv. 2 → ⚔️ Batalha
Lv. 3 → 📈 Evolução
Lv. 4 → 🗺️ Aventura
Lv. 5 → 📜 Missões
Lv. 6 → 🏪 Loja
Lv. 8 → 👹 Boss
Lv. 10 → ⚔️ PvP


O objetivo é criar uma sensação constante de:

🔓 NOVO SISTEMA DESBLOQUEADO!

Isso torna a progressão muito mais interessante.

📖 Pequena história inicial

Adicionar uma história simples para dar contexto ao jogador.

Não é necessário criar uma campanha enorme inicialmente.

Começar com:

 Introdução.
 Primeiro personagem.
 Primeiro objetivo.
 Primeiro rival.
 Primeiro mistério.
 Primeiro grande desafio.

Pequenos diálogos já podem fazer o jogo parecer muito mais vivo.

👤 NPCs

Adicionar personagens que interajam com o jogador.

Exemplo:

🧙 MESTRE

"Você é novo por aqui?"

"Faça uma invocação e volte
quando estiver pronto."

[ CONTINUAR ]


NPCs podem fornecer:

 Missões.
 Diálogos.
 Recompensas.
 Dicas.
 Pequenas histórias.
 Eventos.
🧠 Sistema de escolhas

Adicionar pequenas escolhas durante a aventura.

Exemplo:

Você encontrou dois caminhos.

🌲 FLORESTA

+ XP
Mais inimigos

ou

💎 CAVERNA

+ Recursos
Menos XP

[ FLORESTA ]

[ CAVERNA ]


As escolhas não precisam mudar toda a história.

Elas servem para fazer o jogador sentir que está participando da jornada.

🏆 Conquistas

Adicionar objetivos permanentes.

Exemplos:

 Fazer a primeira invocação.
 Conseguir o primeiro personagem raro.
 Evoluir um personagem.
 Completar determinada quantidade de missões.
 Explorar determinada quantidade de áreas.
 Vencer determinada quantidade de batalhas.
 Colecionar personagens.
 Alcançar determinados níveis.

Cada conquista deve ter uma pequena recompensa.

🔄 Mais variedade nas atividades

Evitar que o jogador precise repetir sempre a mesma atividade.

Criar uma rotação de atividades:

Hoje:

⚔️ Treinamento
🎁 Evento especial
🗺️ Exploração
📜 Missões

Amanhã:

⚔️ Desafio
🎲 Minigame
💎 Dungeon
🎁 Evento


Isso ajuda a criar uma experiência menos repetitiva.

📱 Melhorar a experiência no celular
 Interface totalmente responsiva.
 Botões maiores.
 Menus adaptados para toque.
 Cards responsivos.
 Navegação inferior.
 Melhor utilização do espaço da tela.
 Animações otimizadas para dispositivos mais fracos.
🔊 Melhorar o áudio

O sistema de áudio já existe. A ideia é aumentar a variedade.

 Música diferente por área.
 Música de batalha.
 Música de Boss.
 Sons específicos para raridades.
 Sons de recompensas.
 Sons de level up.
 Sons de desbloqueio.
 Sons de eventos.
🧠 Sistema de "sempre tem algo para fazer"

Uma meta importante é evitar que o jogador entre no jogo e pense:

"Tá... e agora?"

A Home deve mostrar claramente:

🎯 OBJETIVO ATUAL

Complete 1 batalha.

██████░░░░ 60%

🎁 Recompensa:
100 💎


E abaixo:

🔥 EVENTO
Novo desafio disponível!

🎁 RECOMPENSA
Você possui recompensas para coletar.

🔓 DESBLOQUEIO
Nova atividade disponível no nível 8.


Assim, sempre existe uma próxima ação.

❤️ Tornar o jogo mais envolvente

A prioridade não é simplesmente adicionar mais sistemas.

É fazer os sistemas existentes se conectarem.

O jogador deve sentir:

🎮 JOGAR
   ↓
🎁 GANHAR
   ↓
📈 EVOLUIR
   ↓
🔓 DESBLOQUEAR
   ↓
🎰 INVOCAR
   ↓
⭐ CONSEGUIR ALGO NOVO
   ↓
🧩 MONTAR UM TIME MELHOR
   ↓
🗺️ EXPLORAR
   ↓
🎁 GANHAR NOVOS RECURSOS
   ↓
📈 EVOLUIR NOVAMENTE


O objetivo é criar um ciclo em que o jogador tenha sempre uma pequena recompensa ou descoberta pela frente.

🛠️ Melhorias técnicas
 Separar arquivos grandes do frontend.
 Organizar melhor CSS e JavaScript.
 Criar componentes reutilizáveis.
 Melhorar tratamento de erros.
 Criar testes automatizados.
 Melhorar logs.
 Monitorar erros em produção.
 Melhorar segurança das rotas.
 Validar ações importantes no servidor.
 Melhorar sistema de backup.
 Criar sistema de migração do banco.
🗓️ Roadmap
🌱 Curto prazo
 Melhorar tutorial.
 Criar Jornada Inicial.
 Criar objetivos guiados.
 Reduzir dependência de bosses no início.
 Melhorar recompensas iniciais.
 Melhorar interface.
 Criar mais feedback visual.
🎮 Médio prazo
 Modo Aventura.
 Exploração.
 Eventos aleatórios.
 Minigames.
 NPCs.
 Sistema de escolhas.
 Pequena história.
 Mais animações.
🌎 Longo prazo
 Novas áreas.
 Eventos maiores.
 Sistema de temporadas.
 Guildas.
 Raids.
 Mais conteúdo PvE.
 Mais conteúdo social.
 Melhorias avançadas de progressão.
🎯 Objetivo da evolução

A direção futura do projeto pode ser resumida em quatro pontos:

🎮 Mais divertido

Mais atividades e menos repetição.

✨ Mais bonito

Mais animações, efeitos, personagens e ambientes.

🌱 Mais acessível

Um jogador novo deve conseguir entender e aproveitar o jogo sem precisar dominar todos os sistemas.

🔥 Mais envolvente

Sempre deve existir um próximo objetivo, recompensa ou descoberta.

<div align="center">
🎴 Sua jornada está apenas começando.
🎮 JOGAR GACHA GAME
</div>
