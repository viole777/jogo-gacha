# 🎮 Gacha Game

Um jogo de **Gacha baseado em universos de anime**, onde você coleta personagens, monta seu time e enfrenta desafios cada vez mais difíceis.

**[Jogar Agora](https://jogo-gacha.onrender.com/)** • **[Relatório de Bugs](../../issues)** • **[Discussões](../../discussions)**

---

## ✨ Principais Recursos

- **🎰 Gacha:** Obtenha personagens de diferentes raridades
- **🏆 Coleção:** Organize, favorite, evolua e monte seu time
- **👹 Bosses:** Enfrente chefes em batalhas animadas
- **⚔️ PvP:** Dispute contra outros jogadores e suba no ranking
- **🌍 Ranking Global:** Compete pelo Top 50 mundial
- **📜 Missões:** Complete desafios diários, semanais e de história
- **📅 Login Diário:** Receba recompensas por manter sua sequência
- **🏪 Loja:** Compre itens e negocie personagens
- **🔊 Sistema de Áudio:** Efeitos de batalha, vitória e derrota

O projeto combina **coleção, estratégia, progressão e competição**, criando uma experiência inspirada nos tradicionais jogos de gacha e anime.

---

## 🚀 Quick Start

### Requisitos
- Node.js (v14+)
- Python (v3.8+)
- SQLite3

### Instalação

```bash
# Clone o repositório
git clone https://github.com/viole777/jogo-gacha.git
cd jogo-gacha

# Instale as dependências do backend
pip install -r requirements.txt

# Instale as dependências do frontend
npm install

# Inicie o servidor
npm run dev
```

O jogo estará disponível em `http://localhost:3000`

---

## 🛠️ Tecnologia

| Tecnologia | Uso |
|-----------|-----|
| **JavaScript** | Frontend, interatividade |
| **Python** | Backend, lógica do servidor |
| **HTML** | Estrutura da página |
| **SQLite** | Persistência de dados |

**Estrutura de Linguagens:**
- JavaScript: 43.7%
- Python: 32.4%
- HTML: 23.9%

---

## 💾 Persistência de Dados

O progresso dos jogadores é armazenado em **SQLite**. 

### Em Desenvolvimento
```bash
DB_PATH=./gacha-game.db npm run dev
```

### Em Produção (Render)

1. Configure um disco persistente em `/var/data`
2. Defina a variável de ambiente:
   ```
   DB_PATH=/var/data/gacha-game.db
   ```
3. O servidor criará até **10 backups automáticos**:
   - Um ao iniciar
   - Cada 15 minutos
   - Um no encerramento

Para verificar a saúde da aplicação:
```bash
curl https://jogo-gacha.onrender.com/api/health
```

---

## 🎮 Como Jogar

### 🌱 Seu Primeiro Passo

1. **Gacha** → Invoque seu primeiro personagem
2. **Montar Time** → Escolha 3 personagens para sua equipe
3. **Batalha** → Enfrente inimigos e ganhe recursos
4. **Evoluir** → Use recursos para fortalecer seus personagens
5. **Explorar** → Desbloqueie novas áreas e atividades

### 📊 Sistemas Principais

- **Gacha:** Diferentes raridades (⭐ a ⭐⭐⭐⭐⭐)
- **Evolução:** Fortaleça personagens com recursos
- **Batalhas:** PvE contra bosses e PvP contra jogadores
- **Ranking:** Suba entre os top 50 globais
- **Eventos:** Participem de eventos temporários

---

## 📋 Roadmap

### 🌱 Curto Prazo
- [ ] Melhorar tutorial inicial
- [ ] Criar jornada guiada para novos jogadores
- [ ] Reduzir dependência de bosses no início
- [ ] Melhorar feedback visual

### 🎮 Médio Prazo
- [ ] Modo Aventura com exploração
- [ ] Eventos aleatórios
- [ ] Minigames
- [ ] NPCs com diálogos
- [ ] Sistema de escolhas
- [ ] deixar a jogabilidade inicial mais facil
- [ ] adicionar codigos com recompensas no jogo
- [ ] corrigir sistema de missões quebrado

### 🌎 Longo Prazo
- [ ] Novas áreas e mapas
- [ ] Sistema de temporadas
- [ ] Guildas e raids
- [ ] Mais conteúdo social
- [ ] adicionar mais personagens com ataques baseados em gifs



**Os jogos mobile baseados em gacha utilizam uma evolução direta dos estímulos dos cassinos, adaptada para telas de toque e sessões rápidas. As principais estratégias visuais usadas por jogos como Genshin Impact, Honkai: Star Rail e outros para prender o cérebro do jogador incluem:1. O Ritual do "Pull" e a Mudança de CoresO momento de abrir um pacote ou invocar um personagem (o "pull") é o clímax visual do jogo. Ele nunca é instantâneo; é um evento coreografado:Antecipação Meteorológica: Uma estrela ou meteoro cruza a tela em câmera lenta. O movimento lento serve para criar uma tensão visual absurda.O Código de Cores: O cérebro aprende instantaneamente a ler os padrões de raridade. Em segundos, a animação muda de cor. Uma luz azul ou roxa gera frustração ou alívio mediano, enquanto o brilho dourado/arco-íris causa uma explosão visual que aciona o pico máximo de dopamina.2. Design de Personagens Hiperatraente (O Apelo Estético)Diferente das frutas tridimensionais do caça-níqueis, os gachas usam o apego emocional.Splash Arts Monumentais: Quando você ganha um personagem raro, o jogo exibe uma ilustração estática gigantesca, detalhada e cheia de efeitos de luz dinâmicos (partículas flutuando, fogo, gelo).Modelagem e Fluidez: Os menus de visualização permitem girar o personagem em 360°, exibindo roupas complexas, animações de repouso carismáticas e efeitos visuais exclusivos de combate. O jogo te faz desejar a estética do personagem tanto quanto seu poder de batalha.3. Esconder o Dinheiro sob Camadas de Interfaces e MoedasO cérebro humano sente dor psicológica ao ver o dinheiro real sumindo. Os jogos mitigam isso visualmente:Gemas Coloridas: Seu dinheiro vira cristais brilhantes e coloridos, que depois viram "bilhetes de invocação". Visualmente, o jogador perde a noção de que cada clique está custando dezenas de reais, parecendo apenas que está gastando "itens colecionáveis" do próprio jogo.4. Barras de Progresso Irresistíveis (Efeito Pity)O ser humano odeia ver círculos ou barras incompletas em interfaces.Os jogos gacha colocam contadores visuais ou barras que mostram quão perto você está do sistema de Pity (a garantia de ganhar um item raro após um número X de tentativas). Ver uma barra visualmente "quase cheia" estimula o cérebro a fazer mais um gasto, gerando a sensação visual de que a vitória está logo ali.5. Indicadores Vermelhos de Notificação (Os "Red Dots")Nas telas de menu, pequenas bolinhas vermelhas piscam constantemente em cima de ícones para indicar que há recompensas diárias gratuitas para coletar ou menus para abrir. Visualmente, esse ponto vermelho gera uma urgência incômoda no usuário, forçando-o a clicar para "limpar" a tela, o que o mantém navegando pelos menus do jogo e exposto a ofertas da loja virtual.**

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para reportar bugs ou sugerir melhorias:

1. Abra uma [issue](../../issues)
2. Descreva o problema ou sugestão
3. Forneça detalhes e capturas de tela se possível

---

## 📞 Suporte

- 🐛 **Reportar Bug:** [GitHub Issues](../../issues)
- 💬 **Discussões:** [GitHub Discussions](../../discussions)
- 🌐 **Jogar:** [jogo-gacha.onrender.com](https://jogo-gacha.onrender.com/)

---

## 📜 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

<div align="center">

### 🎴 Sua jornada está apenas começando.

**[JOGAR GACHA GAME →](https://jogo-gacha.onrender.com/)**

</div>
